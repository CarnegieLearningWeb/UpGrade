import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { UserRole } from 'upgrade_types';
import { IUserSearchParams, IUserSortParams, USER_SEARCH_SORT_KEY } from '../controllers/validators/UserPaginatedParamsValidator';
import { systemUserDoc } from '../../init/seed/systemUser';

@Service()
export class UserService {
  constructor(
    @OrmRepository() private userRepository: UserRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public async create(user: User): Promise<User> {
    this.log.info('Create a new user => ', JSON.stringify(user, undefined, 2));
    return this.userRepository.upsertUser(user);
  }

  public find(): Promise<User[]> {
    return this.userRepository.find();
  }

  public async getTotalCount(): Promise<number> {
    this.log.info('Find a count of total users');
    const totalUsers = await this.userRepository.count() - 1; // Subtract system User
    return totalUsers;
  }

  public async findPaginated(
    skip: number,
    take: number,
    searchParams?: IUserSearchParams,
    sortParams?: IUserSortParams
  ): Promise<any[]> {
    this.log.info(`Find paginated Users`);
    let queryBuilder  = this.userRepository
    .createQueryBuilder('users');

    if (searchParams) {
      const customSearchString = searchParams.string.split(' ').join(`:*&`);
      // add search query
      const postgresSearchString = this.postgresSearchString(searchParams.key);
      queryBuilder = queryBuilder
        .addSelect(`ts_rank_cd(to_tsvector('english',${postgresSearchString}), to_tsquery(:query))`, 'rank')
        .addOrderBy('rank', 'DESC')
        .setParameter('query', `${customSearchString}:*`);
    }

    if (sortParams) {
      queryBuilder = queryBuilder.addOrderBy(`users.${sortParams.key}`, sortParams.sortAs);
    }
    const systemEmail = systemUserDoc.email;
    queryBuilder = queryBuilder
      .where('users.email != :email', { email: systemEmail })
      .skip(skip)
      .take(take);

    return queryBuilder.getMany();
  }

  public async getUserByEmail(email: string): Promise<User[]> {
    return this.userRepository.findByIds([email]);
  }

  public updateUserRole(email: string, role: UserRole): Promise<User> {
    return this.userRepository.updateUserRole(email, role);
  }

  private postgresSearchString(type: string): string {
    const searchString: string[] = [];
    switch (type) {
      case USER_SEARCH_SORT_KEY.FIRST_NAME:
        // TODO: Update column name
        searchString.push("coalesce(users.firstName::TEXT,'')");
        break;
      case USER_SEARCH_SORT_KEY.LAST_NAME:
        // TODO: Update column name
        searchString.push("coalesce(users.lastName::TEXT,'')");
        break;
      case USER_SEARCH_SORT_KEY.EMAIL:
        searchString.push("coalesce(users.email::TEXT,'')");
        break;
      case USER_SEARCH_SORT_KEY.ROLE:
        searchString.push("coalesce(users.role::TEXT,'')");
        break;
      default:
        // TODO: Update column name
        // searchString.push("coalesce(users.firstName::TEXT,'')");
        // searchString.push("coalesce(users.lastName::TEXT,'')");
        searchString.push("coalesce(users.email::TEXT,'')");
        searchString.push("coalesce(users.role::TEXT,'')");
        break;
    }
    const stringConcat = searchString.join(',');
    const searchStringConcatenated = `concat_ws(' ', ${stringConcat})`;
    return searchStringConcatenated;
  }
}
