import { v4 as uuidv4 } from "uuid";

export class User {
  id: string;
  name: string;
  groupId?: string;

  constructor(id: string, name: string, groupId?: string) {
    this.id = id;
    this.name = name;
    this.groupId = groupId;
  }
}

export class UserManager {
  private static instance: UserManager;

  private users: Map<string, User>;
  private currentUser?: User;

  private constructor() {
    this.users = new Map();
  }

  // Using a singleton here since we don't have a real DB
  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  async createUser(name: string, groupId?: string): Promise<User> {
    const userId = uuidv4();
    const user = new User(userId, name, groupId ?? userId);
    this.users.set(userId, user);
    return user;
  }

  async deleteUser(userId: string) {
    if (!this.users.has(userId)) {
      throw new Error("User not found");
    }
    this.users.delete(userId);
  }

  async findUserById(userId: string): Promise<User | undefined> {
    return this.users.get(userId);
  }

  async findUserByName(name: string): Promise<User | undefined> {
    // This would be replaced by an indexed SQL query in a production system
    for (const user of this.users.values()) {
      if (user.name === name) {
        return user;
      }
    }
    return undefined;
  }

  async getCurrentUser(): Promise<User | undefined> {
    return this.currentUser;
  }

  async setCurrentUserById(userId: string) {
    this.currentUser = await this.findUserById(userId);
  }

  async setCurrentUserByName(name: string) {
    const user = await this.findUserByName(name);

    if (!user) {
      throw new Error("User not found");
    }

    this.currentUser = user;
  }
}
