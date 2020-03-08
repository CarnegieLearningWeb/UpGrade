import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';

@Service()
export class UserService {
  constructor(
    @OrmRepository() private userRepository: UserRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public create(user: User): Promise<User> {
    this.log.info('Create a new user => ', user.toString());
    return this.userRepository.save(user);
  }
}
