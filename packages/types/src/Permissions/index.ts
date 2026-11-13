import { UserRole } from '../Experiment/enums';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export type PermissionResource =
  | 'experiments'
  | 'stratifications'
  | 'users'
  | 'logs'
  | 'manageRoles'
  | 'featureFlags'
  | 'metrics'
  | 'segments';

export type ResourcePermissions = Record<PermissionAction, boolean>;

export type RolePermissions = Record<PermissionResource, ResourcePermissions>;

const ALL: ResourcePermissions = { create: true, read: true, update: true, delete: true };
const READ_ONLY: ResourcePermissions = { create: false, read: true, update: false, delete: false };

/**
 * What each role may do to each resource. The frontend uses this to show or hide actions; the backend enforces it.
 * Permissions for managing queries are the same as for experiments.
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    experiments: ALL,
    stratifications: ALL,
    users: ALL,
    logs: ALL,
    manageRoles: ALL,
    featureFlags: ALL,
    metrics: ALL,
    segments: ALL,
  },
  [UserRole.CREATOR]: {
    experiments: ALL,
    stratifications: ALL,
    users: ALL,
    logs: READ_ONLY,
    manageRoles: READ_ONLY,
    featureFlags: ALL,
    metrics: ALL,
    segments: ALL,
  },
  [UserRole.USER_MANAGER]: {
    experiments: READ_ONLY,
    stratifications: READ_ONLY,
    users: ALL,
    logs: READ_ONLY,
    manageRoles: READ_ONLY,
    featureFlags: READ_ONLY,
    metrics: READ_ONLY,
    segments: { create: false, read: true, update: true, delete: true },
  },
  [UserRole.READER]: {
    experiments: READ_ONLY,
    stratifications: READ_ONLY,
    users: READ_ONLY,
    logs: READ_ONLY,
    manageRoles: READ_ONLY,
    featureFlags: READ_ONLY,
    metrics: READ_ONLY,
    segments: READ_ONLY,
  },
};

/** Whether a role may perform an action on a resource. An unknown or missing role is permitted nothing. */
export function isPermitted(
  role: UserRole | undefined,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  return !!role && !!ROLE_PERMISSIONS[role]?.[resource][action];
}
