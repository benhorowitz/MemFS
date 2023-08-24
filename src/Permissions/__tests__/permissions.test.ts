import { Permissions, Permission, PermissionSet } from "../permissions";
import { User } from "../userManager";

describe("Permissions", () => {
  let ownerPerms: PermissionSet;
  let groupPerms: PermissionSet;
  let everyonePerms: PermissionSet;

  beforeEach(() => {
    ownerPerms = new Set([Permission.READ, Permission.WRITE]);
    groupPerms = new Set([Permission.READ]);
    everyonePerms = new Set([Permission.EXECUTE]);
  });

  test("check owner permissions", () => {
    const permissions = new Permissions(
      "1",
      "100",
      ownerPerms,
      groupPerms,
      everyonePerms,
    );
    const ownerUser = new User("1", "Alice", "100"); // Assuming User has these properties

    expect(
      permissions.userHasPermission(Permission.READ, ownerUser),
    ).toBeTruthy();
    expect(
      permissions.userHasPermission(Permission.WRITE, ownerUser),
    ).toBeTruthy();
    expect(
      permissions.userHasPermission(Permission.EXECUTE, ownerUser),
    ).toBeFalsy();
  });

  test("check group permissions", () => {
    const permissions = new Permissions(
      "1",
      "100",
      ownerPerms,
      groupPerms,
      everyonePerms,
    );
    const groupUser = new User("2", "Bob", "100");

    expect(
      permissions.userHasPermission(Permission.READ, groupUser),
    ).toBeTruthy();
    expect(
      permissions.userHasPermission(Permission.WRITE, groupUser),
    ).toBeFalsy();
    expect(
      permissions.userHasPermission(Permission.EXECUTE, groupUser),
    ).toBeFalsy();
  });

  test("check everyone permissions", () => {
    const permissions = new Permissions(
      "1",
      "100",
      ownerPerms,
      groupPerms,
      everyonePerms,
    );
    const otherUser = new User("3", "Charlie", "101");

    expect(
      permissions.userHasPermission(Permission.READ, otherUser),
    ).toBeFalsy();
    expect(
      permissions.userHasPermission(Permission.WRITE, otherUser),
    ).toBeFalsy();
    expect(
      permissions.userHasPermission(Permission.EXECUTE, otherUser),
    ).toBeTruthy();
  });

  test("check permissions when no user provided", () => {
    const permissions = new Permissions(
      "1",
      "100",
      ownerPerms,
      groupPerms,
      everyonePerms,
    );

    expect(permissions.userHasPermission(Permission.READ)).toBeFalsy();
    expect(permissions.userHasPermission(Permission.WRITE)).toBeFalsy();
    expect(permissions.userHasPermission(Permission.EXECUTE)).toBeTruthy();
  });
});
