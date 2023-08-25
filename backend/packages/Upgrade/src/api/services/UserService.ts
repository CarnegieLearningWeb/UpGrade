import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { SERVER_ERROR, UserRole } from 'upgrade_types';
import {
  USER_SEARCH_SORT_KEY, UserSearchParamsValidator, UserSortParamsValidator,
} from '../controllers/validators/UserPaginatedParamsValidator';
import { systemUserDoc } from '../../init/seed/systemUser';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { AWSService } from './AWSService';
import { env } from '../../env';
import { ErrorWithType } from '../errors/ErrorWithType';
import { Emails } from '../../templates/email';
import { UserDetailsValidator } from '../controllers/validators/UserDetailsValidator';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';

@Service()
export class UserService {
  constructor(
    @OrmRepository()
    private userRepository: UserRepository,
    public awsService: AWSService,
    public emails: Emails
  ) {}

  public async upsertUser(userDTO: UserDetailsValidator, logger: UpgradeLogger): Promise<User> {
    const user = new User();
    user.email = userDTO.email;
    user.firstName = userDTO.firstName;
    user.lastName = userDTO.lastName
    user.role = userDTO.role;
    user.imageUrl = userDTO.imageUrl
    user.localTimeZone = userDTO.localTimeZone;
    user.auditLogs = userDTO.auditLogs?.map(auditLogDTO => {
      const auditLog = new ExperimentAuditLog()
      auditLog.data = auditLogDTO.data;
      auditLog.id = auditLogDTO.id;
      auditLog.type = auditLogDTO.type;
      return auditLog;
    });
  
    logger.info({ message: `Upsert a new user => ${JSON.stringify(user, undefined, 2)}` });

    const isUserExists = await this.userRepository.find({ where: { email: user.email } });
    const response = await this.userRepository.upsertUser(user);
    if (!isUserExists && response) {
      this.sendWelcomeEmail(user.email);
    }
    return response;
  }

  public async upsertAdminUser(user: User, logger: UpgradeLogger): Promise<User> {
    logger.info({ message: `Upsert a new Admin user => ${JSON.stringify(user, undefined, 2)}` });

    return this.userRepository.upsertUser(user);
  }

  public find(logger: UpgradeLogger): Promise<User[]> {
    logger.info({ message: 'Find all users' });
    return this.userRepository.find();
  }

  public async getTotalCount(logger: UpgradeLogger): Promise<number> {
    logger.info({ message: 'Find a count of total users' });
    const totalUsers = (await this.userRepository.count()) - 1; // Subtract system User
    return totalUsers;
  }

  public async findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: UserSearchParamsValidator,
    sortParams?: UserSortParamsValidator
  ): Promise<any[]> {
    logger.info({ message: `Find paginated Users` });
    let queryBuilder = this.userRepository.createQueryBuilder('users');

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
    queryBuilder = queryBuilder.where('users.email != :email', { email: systemEmail }).skip(skip).take(take);

    return queryBuilder.getMany();
  }

  public async getUserByEmail(email: string): Promise<User[]> {
    return this.userRepository.findByIds([email]);
  }

  public async updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole): Promise<User> {
    const response = await this.userRepository.updateUserDetails(firstName, lastName, email, role);
    if (response) {
      this.sendRoleChangedEmail(email, role);
    }
    return response;
  }

  public deleteUser(email: string): Promise<User> {
    return this.userRepository.deleteUserByEmail(email);
  }

  private postgresSearchString(type: string): string {
    const searchString: string[] = [];
    switch (type) {
      case USER_SEARCH_SORT_KEY.FIRST_NAME:
        // TODO: Update column name
        searchString.push(`coalesce(users."firstName"::TEXT,'')`);
        break;
      case USER_SEARCH_SORT_KEY.LAST_NAME:
        // TODO: Update column name
        searchString.push(`coalesce(users."lastName"::TEXT,'')`);
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

  public sendWelcomeEmail(email: string): void {
    const emailSubject = `Welcome to UpGrade!`;
    const emailBody = this.emails.welcomeEmailBody();
    this.sendEmail(email, emailSubject, emailBody);
  }

  public sendRoleChangedEmail(email: string, role: UserRole): void {
    const emailSubject = `UpGrade Role Changed`;
    const emailBody = this.emails.roleChangeEmailBody(role);
    this.sendEmail(email, emailSubject, emailBody);
  }

  public async sendEmail(email_to: string, emailSubject: string, emailBody: string): Promise<string> {
    try {
      const email_from = env.email.from;
      const emailText = this.emails.generateEmailText(emailBody);
      await this.awsService.sendEmail(email_from, email_to, emailText, emailSubject);
    } catch (err) {
      const error = err as ErrorWithType;
      error.type = SERVER_ERROR.EMAIL_SEND_ERROR;
      throw error;
    }

    return '';
  }
}
