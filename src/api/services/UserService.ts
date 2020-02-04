import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { UserRepository } from '../repositories/UserRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentUser } from '../models/ExperimentUser';
import uuid from 'uuid/v4';

@Service()
export class UserService {
  constructor(
    @OrmRepository() private userRepository: UserRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<ExperimentUser[]> {
    this.log.info(`Find all users`);
    return this.userRepository.find();
  }

  public findOne(id: string): Promise<ExperimentUser> {
    this.log.info(`Find user by id => ${id}`);
    return this.userRepository.findOne({ id });
  }

  public create(users: ExperimentUser[]): Promise<ExperimentUser[]> {
    this.log.info('Create a new user => ', users.toString());
    const multipleUsers = users.map(user => {
      user.id = user.id || uuid();
      return user;
    });
    return this.userRepository.save(multipleUsers);
  }

  public update(id: string, user: ExperimentUser): Promise<ExperimentUser> {
    this.log.info('Update a user => ', user.toString());
    user.id = id;
    return this.userRepository.save(user);
  }
}
