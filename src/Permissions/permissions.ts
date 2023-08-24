import { User } from "./userManager";

export enum Permission {
  READ = "r",
  WRITE = "w",
  EXECUTE = "x",
}

export type PermissionSet = Set<Permission>;

/**
 * A set of permissions for a file or directory
 * @property owningUserId - the id of the user that owns the file or directory
 * @property owningGroupId - the id of the group that owns the file or directory
 * @property ownerPerms - the permissions for the owner of the file or directory
 * @property groupPerms - the permissions for the group of the file or directory
 * @property everyonePerms - the permissions for everyone else
 * @method checkPermission - check if the current user has a permission
 */
export class Permissions {
  owningUserId: string;
  owningGroupId: string;
  ownerPerms: PermissionSet;
  groupPerms: PermissionSet;
  everyonePerms: PermissionSet;

  constructor(
    owningUserId: string,
    owningGroupId: string,
    ownerPerms: PermissionSet,
    groupPerms: PermissionSet,
    everyonePerms: PermissionSet,
  ) {
    this.owningUserId = owningUserId;
    this.owningGroupId = owningGroupId;
    this.ownerPerms = ownerPerms;
    this.groupPerms = groupPerms;
    this.everyonePerms = everyonePerms;
  }

  /**
   * Check if the given user has a permission. If no user is given, assume we're checking permissions for everyone
   * @param permission
   * @returns true if the current user has the permission, false otherwise
   */
  userHasPermission(permission: Permission, user?: User): boolean {
    if (user?.id === this.owningUserId) {
      return this.ownerPerms.has(permission);
    }

    if (user?.groupId === this.owningGroupId) {
      return this.groupPerms.has(permission);
    }

    return this.everyonePerms.has(permission);
  }
}
