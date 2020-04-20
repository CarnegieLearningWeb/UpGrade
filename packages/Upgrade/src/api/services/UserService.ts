import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { UserRole } from 'ees_types';
import { systemUserDoc } from '../../init/seed/systemUser';

@Service()
export class UserService {
  constructor(
    @OrmRepository() private userRepository: UserRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public create(user: User): Promise<User> {
    this.log.info('Create a new user => ', user.toString());
    return this.userRepository.upsertUser(user);
  }

  public findAll(): Promise<User[]> {
    // As systemUserDoc can not be directly used in where clause, pass it in method
    return this.userRepository.getAllUser(systemUserDoc.email);
  }

  public async getUserByEmail(email: string): Promise<User[]> {
    return this.userRepository.findByIds([email]);
  }

  public updateUserRole(email: string, role: UserRole): Promise<User> {
    return this.userRepository.updateUserRole(email, role);
  }
}
