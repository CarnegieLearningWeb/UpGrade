import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { UserRole } from 'upgrade_types';

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
    // As systemUserDoc can not be directly used in where clause, pass it in method
    return this.userRepository.find();
  }

  public async getUserByEmail(email: string): Promise<User[]> {
    return this.userRepository.findByIds([email]);
  }

  public updateUserRole(email: string, role: UserRole): Promise<User> {
    return this.userRepository.updateUserRole(email, role);
  }
}
