import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentUser } from '../models/ExperimentUser';
import uuid from 'uuid/v4';

@Service()
export class ExperimentUserService {
  constructor(
    @OrmRepository() private userRepository: ExperimentUserRepository,
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

  public updateWorkingGroup(userId: string, workingGroup: any): Promise<any> {
    this.log.info('Update working group => ', userId, workingGroup);
    return this.userRepository.updateWorkingGroup(userId, workingGroup);
  }

  public update(id: string, user: ExperimentUser): Promise<ExperimentUser> {
    this.log.info('Update a user => ', user.toString());
    user.id = id;
    return this.userRepository.save(user);
  }
}
