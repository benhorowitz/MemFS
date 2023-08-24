import { UserManager } from "../../Permissions/userManager";
import { FileSystem } from "..";

describe("In-Memory File System", () => {
  let fs: FileSystem = new FileSystem();
  const userManager: UserManager = UserManager.getInstance();

  beforeEach(async () => {
    fs = new FileSystem();
    const user = await userManager.createUser("test", "test");
    await userManager.createUser("test2", "test2");
    userManager.setCurrentUserById(user.id);
  });

  test("starts at root directory", async () => {
    expect(await fs.getCurrentDirectory()).toBe("/");
  });

  test("can create a new directory", async () => {
    await fs.makeDirectory("school");
    expect(await fs.listDirectory()).toEqual(["school"]);
  });

  test("can change directory to child directory", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    expect(await fs.getCurrentDirectory()).toBe("/school");
  });

  test("can change directory to parent directory", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    await fs.changeDirectory("..");
    expect(await fs.getCurrentDirectory()).toBe("/");
  });

  test("throws error if changing to non-existent directory", async () => {
    await expect(fs.changeDirectory("nonexistent")).rejects.toThrowError(
      "File or directory not found",
    );
  });

  test("can remove a directory", async () => {
    await fs.makeDirectory("school");
    await fs.removeDirectory("school");
    expect(await fs.listDirectory()).toEqual([]);
  });

  test("throws error if removing a non-existent directory", async () => {
    await expect(fs.removeDirectory("nonexistent")).rejects.toThrowError(
      "Directory not found or not a directory",
    );
  });

  test("throws error if creating a directory that already exists", async () => {
    await fs.makeDirectory("school");
    await expect(fs.makeDirectory("school")).rejects.toThrowError(
      "Directory already exists",
    );
  });

  test("can create a new file", async () => {
    await fs.createFile("notes.txt");
    expect(await fs.listDirectory()).toContain("notes.txt");
  });

  test("can write to a file and read its contents", async () => {
    await fs.createFile("notes.txt");
    await fs.writeFile("notes.txt", "Hello, world!");
    const contents = await fs.readFile("notes.txt");
    expect(contents).toBe("Hello, world!");
  });

  test("throws error if writing to non-existent file", async () => {
    await expect(
      fs.writeFile("nonexistent.txt", "Hello, world!"),
    ).rejects.toThrowError("File not found");
  });

  test("throws error if reading from non-existent file", async () => {
    expect(fs.readFile("nonexistent.txt")).rejects.toThrowError(
      "File not found",
    );
  });

  test("throws error if creating a file that already exists", async () => {
    await fs.createFile("notes.txt");
    await expect(fs.createFile("notes.txt")).rejects.toThrowError(
      "File already exists",
    );
  });

  test("can list directory contents", async () => {
    await fs.createFile("notes.txt");
    await fs.createFile("notes2.txt");
    await fs.makeDirectory("school");
    expect(await fs.listDirectory()).toEqual([
      "notes.txt",
      "notes2.txt",
      "school",
    ]);
  });

  test("can move a file", async () => {
    await fs.createFile("notes.txt");
    await fs.moveFile("notes.txt", "notes2.txt");
    expect(await fs.listDirectory()).toContain("notes2.txt");
  });

  test("throws error if moving a non-existent file", async () => {
    await expect(
      fs.moveFile("nonexistent.txt", "notes.txt"),
    ).rejects.toThrowError('File "nonexistent.txt" does not exist.');
  });

  test("throws error if moving a file to an existing file", async () => {
    await fs.createFile("notes.txt");
    await fs.createFile("notes2.txt");
    await expect(fs.moveFile("notes.txt", "notes2.txt")).rejects.toThrowError(
      'A node with the name "notes2.txt" already exists.',
    );
  });

  test("can find a directory or file", async () => {
    await fs.makeDirectory("school");
    await fs.createFile("notes.txt");
    const results = await fs.find("school");
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("school");
  });

  test("throws permission error if user does not have permission to read a file", async () => {
    await fs.createFile("notes.txt");
    await userManager.setCurrentUserByName("test2");
    await expect(fs.readFile("notes.txt")).rejects.toThrowError(
      "Permission denied",
    );
  });

  test("throws permission error if user does not have permission to write to a file", async () => {
    await fs.createFile("notes.txt");
    await userManager.setCurrentUserByName("test2");
    await expect(
      fs.writeFile("notes.txt", "Hello, world!"),
    ).rejects.toThrowError("Permission denied");
  });

  test("throws permission error if user does not have permission to read a directory", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    await userManager.setCurrentUserByName("test2");
    await expect(fs.listDirectory()).rejects.toThrowError("Permission denied");
  });

  test("throws permission error if user does not have permission to write to a directory", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    await userManager.setCurrentUserByName("test2");
    await expect(fs.makeDirectory("school2")).rejects.toThrowError(
      "Permission denied",
    );
  });

  test("throws permission error if user does not have permission to remove a directory", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    await fs.makeDirectory("science");
    await userManager.setCurrentUserByName("test2");
    await expect(fs.removeDirectory("science")).rejects.toThrowError(
      "Permission denied",
    );
  });

  test("throws permission error if user does not have permission to move a file", async () => {
    await fs.createFile("notes.txt");
    await userManager.setCurrentUserByName("test2");
    await expect(fs.moveFile("notes.txt", "notes2.txt")).rejects.toThrowError(
      "Permission denied",
    );
  });

  test("throws permission error if user does not have permission to create a file", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    await userManager.setCurrentUserByName("test2");
    await expect(fs.createFile("notes.txt")).rejects.toThrowError(
      "Permission denied",
    );
  });

  test("throws an error if trying to write to a directory", async () => {
    await fs.makeDirectory("school");
    await expect(fs.writeFile("school", "Hello, world!")).rejects.toThrowError(
      "Cannot write to this location because it's not a file",
    );
  });

  test("throws an error if trying to read a directory", async () => {
    await fs.makeDirectory("school");
    await expect(fs.readFile("school")).rejects.toThrowError(
      "Cannot read this location because it's not a file",
    );
  });

  test("can change directory to the root directory", async () => {
    await fs.makeDirectory("school");
    await fs.changeDirectory("school");
    await fs.changeDirectory("/");
    expect(await fs.getCurrentDirectory()).toBe("/");
  });
});
