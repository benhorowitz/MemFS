import { User, UserManager } from "../userManager";

// Mock uuid to always return 'mockId'
jest.mock("uuid", () => ({ v4: () => "mockId" }));

describe("User Class", () => {
  test("should correctly instantiate a user", () => {
    const user = new User("12345", "Alice", "group1");
    expect(user.id).toBe("12345");
    expect(user.name).toBe("Alice");
    expect(user.groupId).toBe("group1");
  });
});

describe("UserManager Class", () => {
  let userManager: UserManager;

  beforeEach(() => {
    // Clear the instance to get a fresh UserManager for each test (breaking linter rules a bit here for testing)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (UserManager as any).instance = undefined;
    userManager = UserManager.getInstance();
  });

  test("should create a user", async () => {
    const user = await userManager.createUser("Alice", "group1");
    expect(user.id).toBe("mockId");
    expect(user.name).toBe("Alice");
    expect(user.groupId).toBe("group1");
  });

  test("should delete a user", async () => {
    await userManager.createUser("Alice", "group1");
    await userManager.deleteUser("mockId");
    expect(await userManager.findUserById("mockId")).toBeUndefined();
  });

  test("should throw error when deleting non-existent user", async () => {
    await expect(() => userManager.deleteUser("nonExistentId")).rejects.toThrow(
      "User not found",
    );
  });

  test("should find user by ID", async () => {
    await userManager.createUser("Alice", "group1");
    const user = await userManager.findUserById("mockId");
    expect(user?.name).toBe("Alice");
  });

  test("should find user by name", async () => {
    await userManager.createUser("Alice", "group1");
    const user = await userManager.findUserByName("Alice");
    expect(user?.id).toBe("mockId");
  });

  test("should return undefined when finding non-existent user by name", async () => {
    expect(await userManager.findUserByName("Bob")).toBeUndefined();
  });

  test("should return undefined as current user when none set", async () => {
    expect(await userManager.getCurrentUser()).toBeUndefined();
  });

  test("should set current user by id", async () => {
    const user = await userManager.createUser("Alice", "group1");
    await userManager.setCurrentUserByName("Alice");
    expect((await userManager.getCurrentUser())?.id).toBe(user.id);
  });

  test("should set current user by name", async () => {
    const user = await userManager.createUser("Alice", "group1");
    await userManager.setCurrentUserByName("Alice");
    expect((await userManager.getCurrentUser())?.id).toBe(user.id);
  });

  test("should throw error when setting current user to non-existent user", async () => {
    await expect(() => userManager.setCurrentUserByName("Bob")).rejects.toThrow(
      "User not found",
    );
  });

  test("can change the current user", async () => {
    const user1 = await userManager.createUser("Alice", "group1");
    const user2 = await userManager.createUser("Bob", "group2");

    await userManager.setCurrentUserById(user1.id);
    expect((await userManager.getCurrentUser())?.id).toBe(user1.id);

    await userManager.setCurrentUserById(user2.id);
    expect((await userManager.getCurrentUser())?.id).toBe(user2.id);
  });
});
