import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import uuid from 'uuid/v4';
import { PreviewUser } from '../models/PreviewUser';
import { PreviewUserRepository } from '../repositories/PreviewUserRepository';

@Service()
export class PreviewUserService {
  constructor(
    @OrmRepository() private userRepository: PreviewUserRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public find(): Promise<PreviewUser[]> {
    this.log.info(`Find all preview users`);
    return this.userRepository.find();
  }

  public findOne(id: string): Promise<PreviewUser | undefined> {
    this.log.info(`Find user by id => ${id}`);
    return this.userRepository.findOneById(id);
  }

  public create(users: PreviewUser[]): Promise<PreviewUser[]> {
    this.log.info('Create a new user => ', users.toString());
    const multipleUsers = users.map(user => {
      user.id = user.id || uuid();
      return user;
    });
    return this.userRepository.save(multipleUsers);
  }

  public update(id: string, user: PreviewUser): Promise<PreviewUser> {
    this.log.info('Update a user => ', user.toString());
    user.id = id;
    return this.userRepository.save(user);
  }

  public async delete(id: string): Promise<PreviewUser | undefined> {
    this.log.info('Delete a user => ', id.toString());
    const deletedDoc = await this.userRepository.deleteById(id);
    return deletedDoc;
  }
}
