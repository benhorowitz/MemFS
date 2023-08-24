import { Permissions, Permission } from "../Permissions/permissions";
import { User, UserManager } from "../Permissions/userManager";

type NodeMap = Map<string, Node>;
enum NodeType {
  File,
  Directory,
}

/**
 * Helper function to get the default permissions for a new file or directory.
 * Defaults to the current user being the owner and having full permissions,
 * and everyone else having no permissions
 * @returns the default permissions
 */
export async function getDefaultPermissions() {
  const user = await getCurrentUser();
  return new Permissions(
    user?.id ?? "",
    user?.groupId ?? "",
    new Set([Permission.READ, Permission.WRITE, Permission.EXECUTE]),
    new Set([Permission.READ, Permission.WRITE, Permission.EXECUTE]),
    new Set(),
  );
}

/**
 * Helper function to get the current user
 * @returns the current user
 */
async function getCurrentUser(): Promise<User | undefined> {
  return await UserManager.getInstance().getCurrentUser();
}

/**
 * A node in the file system
 * @property name - the name of the node
 * @property nodeType - the type of the node
 * @property content - the contents of the file
 * @property parent - the parent node
 * @property children - the children nodes
 * @property permissions - the permissions of the node, defaults to the default permisions
 */
class Node {
  name: string;
  nodeType: NodeType;
  content: string;
  parent: Node | null;
  children: NodeMap;
  permissions: Permissions;

  constructor(name: string, nodeType: NodeType, permissions: Permissions) {
    this.name = name;
    this.nodeType = nodeType;
    this.content = "";
    this.parent = null;
    this.children = new Map<string, Node>();
    this.permissions = permissions;
  }

  isFile(): boolean {
    return this.nodeType === NodeType.File;
  }

  isDirectory(): boolean {
    return this.nodeType === NodeType.Directory;
  }

  async assertCurrentUserCanRead() {
    if (
      !this.permissions.userHasPermission(
        Permission.READ,
        await getCurrentUser(),
      )
    ) {
      throw new Error("Permission denied");
    }
  }

  async assertCurrentUserCanWrite() {
    if (
      !this.permissions.userHasPermission(
        Permission.WRITE,
        await getCurrentUser(),
      )
    ) {
      throw new Error("Permission denied");
    }
  }
}

/**
 * A simple in-memory file system
 */
export class FileSystem {
  private root: Node;
  private cwd: Node; // current working directory

  constructor() {
    this.root = new Node(
      "",
      NodeType.Directory,
      new Permissions(
        "1",
        "1",
        new Set([Permission.READ, Permission.WRITE, Permission.EXECUTE]),
        new Set([Permission.READ, Permission.WRITE, Permission.EXECUTE]),
        new Set([Permission.READ, Permission.WRITE, Permission.EXECUTE]),
      ),
    );
    this.cwd = this.root;
  }

  /**
   * Get the path of a node
   * @param node
   * @returns the path of the node
   */
  async getPath(node: Node): Promise<string> {
    if (node === this.root) {
      return "/";
    }

    const path: string[] = [];
    while (node) {
      path.unshift(node.name);
      node = node.parent!;
    }
    return path.join("/");
  }

  /**
   * Get a node by name
   * @param name
   * @returns the node with the given name
   * @throws if the node does not exist
   */
  async getNodeByName(name: string): Promise<Node> {
    if (name === "/") {
      return this.root;
    } else if (name === "..") {
      return this.cwd.parent!;
    } else if (this.cwd.children.has(name)) {
      return this.cwd.children.get(name)!;
    } else {
      throw new Error("File or directory not found");
    }
  }

  /**
   * Change the current working directory
   * @param dir
   * @throws if the directory does not exist
   */
  async changeDirectory(dir: string) {
    this.cwd = await this.getNodeByName(dir);
  }

  /**
   * Get the current working directory
   * @returns the current working directory
   */
  async getCurrentDirectory(): Promise<string> {
    return await this.getPath(this.cwd);
  }

  /**
   * Create a new directory
   * @param name
   * @throws if the directory already exists
   */
  async makeDirectory(name: string) {
    await this.cwd.assertCurrentUserCanWrite();

    if (this.cwd.children.has(name)) {
      throw new Error("Directory already exists");
    }
    const newDir = new Node(
      name,
      NodeType.Directory,
      await getDefaultPermissions(),
    );
    newDir.parent = this.cwd;
    this.cwd.children.set(name, newDir);
  }

  /**
   * List the contents of the current working directory
   * @returns the contents of the current working directory
   */
  async listDirectory(): Promise<string[]> {
    await this.cwd.assertCurrentUserCanRead();
    return [...this.cwd.children.keys()];
  }

  /**
   * Remove a directory
   * @param name
   * @throws if the directory does not exist or is not a directory
   */
  async removeDirectory(name: string) {
    await this.cwd.assertCurrentUserCanWrite();

    if (this.cwd.children.get(name)?.isDirectory()) {
      this.cwd.children.delete(name);
    } else {
      throw new Error("Directory not found or not a directory");
    }
  }

  /**
   * Create a new file
   * @param name
   * @throws if the file already exists
   */
  async createFile(name: string) {
    await this.cwd.assertCurrentUserCanWrite();

    if (this.cwd.children.has(name)) {
      throw new Error("File already exists");
    }
    const newFile = new Node(
      name,
      NodeType.File,
      await getDefaultPermissions(),
    );
    newFile.parent = this.cwd;
    this.cwd.children.set(name, newFile);
  }

  /**
   * Write to a file
   * @param name
   * @param content
   * @throws if the file does not exist or is not a file
   */
  async writeFile(name: string, content: string) {
    const node = this.cwd.children.get(name);

    if (!node) {
      throw new Error("File not found");
    }

    await node.assertCurrentUserCanWrite();

    if (!node.isFile()) {
      throw new Error("Cannot write to this location because it's not a file");
    }

    node.content = content;
  }

  /**
   * Read from a file
   * @param name
   * @returns the contents of the file
   * @throws if the file does not exist or is not a file
   */
  async readFile(name: string): Promise<string> {
    const node = this.cwd.children.get(name);

    if (!node) {
      throw new Error("File not found");
    }

    await node.assertCurrentUserCanRead();

    if (!node.isFile()) {
      throw new Error("Cannot read this location because it's not a file");
    }

    return node.content;
  }

  /**
   * Move a file
   * @param oldName
   * @param newName
   * @throws if the file does not exist or if a file with the new name already exists
   */
  async moveFile(oldName: string, newName: string) {
    await this.cwd.assertCurrentUserCanWrite();

    const fileNode = this.cwd.children.get(oldName);

    // Ensure the file exists.
    if (!fileNode) {
      throw new Error(`File "${oldName}" does not exist.`);
    }

    await fileNode?.assertCurrentUserCanWrite();

    // Ensure there isn't already a node with the new name.
    if (this.cwd.children.has(newName)) {
      throw new Error(`A node with the name "${newName}" already exists.`);
    }

    // Remove old file reference and add new file reference.
    this.cwd.children.delete(oldName);
    fileNode.name = newName;
    this.cwd.children.set(newName, fileNode);
  }

  /**
   * Find a nodes in the current working directory with the given name
   * @param name
   * @returns an array of nodes with the given name
   *
   * Note: the instructions are "find all the files and directories within the current working directory
   * that have exactly that name" but since we're using a map we won't have any name collisions. On the bright
   * side, this is O(1) instead of O(n).
   */
  async find(name: string): Promise<Node[]> {
    const results: Node[] = [];

    if (this.cwd.children.has(name)) {
      results.push(this.cwd.children.get(name)!);
    }

    return results;
  }
}
