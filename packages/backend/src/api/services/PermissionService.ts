import { ForbiddenError } from 'routing-controllers';
import { Service } from 'typedi';
import { isPermitted, PermissionAction, PermissionResource } from 'upgrade_types';
import { UserDTO } from '../DTO/UserDTO';

/** Enforces the shared `ROLE_PERMISSIONS` table the frontend uses to show or hide actions. */
@Service()
export class PermissionService {
  /** Throws 403 when the caller's role may not perform the action on the resource. */
  public assertPermitted(user: UserDTO | undefined, resource: PermissionResource, action: PermissionAction): void {
    if (!isPermitted(user?.role, resource, action)) {
      throw new ForbiddenError(`Your role does not allow the ${action} action on ${resource}.`);
    }
  }
}
