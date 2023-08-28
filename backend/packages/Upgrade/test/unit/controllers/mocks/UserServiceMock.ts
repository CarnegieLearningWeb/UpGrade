import { Service } from 'typedi';
import { User } from '../../../../src/api/models/User';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { UserRole } from 'upgrade_types';
import {
  UserSearchParamsValidator,
  UserSortParamsValidator,
} from '../../../../src/api/controllers/validators/UserPaginatedParamsValidator';

@Service()
export default class UserServiceMock {
  public upsertUser(user: User, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public deleteUser(email: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole): Promise<[]> {
    return Promise.resolve([]);
  }

  public getUserByEmail(email: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: UserSearchParamsValidator,
    sortParams?: UserSortParamsValidator
  ): Promise<[]> {
    return Promise.resolve([]);
  }

  public getTotalCount(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
