import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { SERVER_ERROR, UserRole } from 'upgrade_types';
import { IUserSearchParams, IUserSortParams, USER_SEARCH_SORT_KEY } from '../controllers/validators/UserPaginatedParamsValidator';
import { systemUserDoc } from '../../init/seed/systemUser';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { AWSService } from './AWSService';
import { env } from '../../env';
import { ErrorWithType } from '../errors/ErrorWithType';
import { Emails } from '../../templates/email';

@Service()
export class UserService {
  constructor(
    @OrmRepository()
    private userRepository: UserRepository,
    public awsService: AWSService,
    public emails: Emails
  ) {}

  public async upsertUser(user: User, logger: UpgradeLogger): Promise<User> {
    logger.info({ message: `Upsert a new user => ${JSON.stringify(user, undefined, 2)}` });

    const isUserExists = await this.userRepository.findOne({ email: user.email });
    if (!isUserExists) {
      this.sendWelcomeEmail(user.email)
    }
    return this.userRepository.upsertUser(user);
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
    const totalUsers = await this.userRepository.count() - 1; // Subtract system User
    return totalUsers;
  }

  public async findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: IUserSearchParams,
    sortParams?: IUserSortParams
  ): Promise<any[]> {
    logger.info({ message: `Find paginated Users` });
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
    this.sendRoleChangedEmail(email, role);
    return this.userRepository.updateUserRole(email, role);
  }

  public deleteUser(email: string): Promise<User> {
    return this.userRepository.deleteUserByEmail(email);
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
  
  public sendWelcomeEmail(email: string): void {
    const emailSubject = `Welcome to UpGrade!`;
    const emailBody = `Greetings!, 
    <br>
    A new user account was created for you in UpGrade. You can sign into UpGrade using your Google credentials.
    <br>
    Click here to log in: <a href="http://www.localhost:4200">UPGRADE</a>
    <br>
    To know more about how UpGrade works, please visit 
    <a href="https://www.upgradeplatform.org/"> www.upgradeplatform.org</a>
    . To read the documentation, visit 
    <a href="https://upgrade-platform.gitbook.io/upgrade-documentation/"> UpGrade-docs</a>
    <br>`;

    this.sendEmail(email, emailSubject, emailBody);
  }

  public sendRoleChangedEmail(email: string, role: UserRole): void {
    const emailSubject = `UpGrade Role Changed`;
    const emailBody = `Greetings!, 
    <br>
    Your Role in Upgrade is changed to ${role}!
    <br>
    Click here to log in: <a href="http://www.localhost:4200">UPGRADE</a>
    <br>
    To know more about how UpGrade works, please visit 
    <a href="https://www.upgradeplatform.org/"> www.upgradeplatform.org</a>
    . To read the documentation, visit 
    <a href="https://upgrade-platform.gitbook.io/upgrade-documentation/"> UpGrade-docs</a>
    <br>`;

    this.sendEmail(email, emailSubject, emailBody);
  }

  public async sendEmail(email_to: string, emailSubject: string, emailBody: string):Promise<string> {
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
