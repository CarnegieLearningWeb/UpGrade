import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { SERVER_ERROR, UserRole } from 'upgrade_types';
import {
  USER_SEARCH_SORT_KEY,
  UserSearchParamsValidator,
  UserSortParamsValidator,
} from '../controllers/validators/UserPaginatedParamsValidator';
import { systemUserDoc } from '../../init/seed/systemUser';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { AWSService } from './AWSService';
import { env } from '../../env';
import { ErrorWithType } from '../errors/ErrorWithType';
import { Emails } from '../../templates/email';
import { UserDTO } from '../DTO/UserDTO';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';

@Service()
export class UserService {
  private emails: Emails;
  constructor(
    @InjectRepository()
    private userRepository: UserRepository,
    public awsService: AWSService
  ) {
    this.emails = new Emails();
  }

  public async upsertUser(userDTO: UserDTO, logger: UpgradeLogger): Promise<User> {
    const user = new User();
    user.email = userDTO.email;
    user.firstName = userDTO.firstName;
    user.lastName = userDTO.lastName;
    user.role = userDTO.role;
    user.imageUrl = userDTO.imageUrl;
    user.localTimeZone = userDTO.localTimeZone;
    user.auditLogs = userDTO.auditLogs?.map((auditLogDTO) => {
      const auditLog = new ExperimentAuditLog();
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
  ): Promise<[User[], number]> {
    logger.info({ message: `Find paginated Users` });
    const systemEmail = systemUserDoc.email;

    let queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .where('users.email != :email', { email: systemEmail });

    if (searchParams) {
      const whereClause = this.paginatedSearchString(searchParams);
      queryBuilder = queryBuilder.andWhere(whereClause);
    }

    if (sortParams) {
      queryBuilder = queryBuilder.addOrderBy(`users.${sortParams.key}`, sortParams.sortAs);
    }

    const countQueryBuilder = queryBuilder.clone();

    queryBuilder = queryBuilder.offset(skip).limit(take);

    return await Promise.all([queryBuilder.getMany(), countQueryBuilder.getCount()]);
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

  private paginatedSearchString(params: UserSearchParamsValidator): string {
    const type = params.key;
    // escape % and ' characters
    const serachString = params.string.replace(/%/g, '\\$&').replace(/'/g, "''");
    const likeString = `ILIKE '%${serachString}%'`;
    const likes: string[] = [];
    if (type === USER_SEARCH_SORT_KEY.ALL) {
      likes.push(`users.email::TEXT ${likeString}`);
      likes.push(`users.role::TEXT ${likeString}`);
      likes.push(`users."firstName"::TEXT ${likeString}`);
      likes.push(`users."lastName"::TEXT ${likeString}`);
    } else {
      likes.push(`users."${type}"::TEXT ${likeString}`);
    }

    const searchStringConcatenated = `(${likes.join(' OR ')})`;
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
