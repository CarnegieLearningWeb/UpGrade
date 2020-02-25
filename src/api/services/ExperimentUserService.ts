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

  public async setGroupMembership(users: ExperimentUser[]): Promise<ExperimentUser[]> {
    this.log.info('Set Group Membership => ', users);
    const userIds = users.map(user => user.id);
    const oldDocuments = await this.userRepository.findByIds(userIds);
    const oldDocumentMap: Map<string, ExperimentUser> = new Map<string, ExperimentUser>();
    oldDocuments.forEach(document => {
      oldDocumentMap.set(document.id, document);
    });
    const newDocumentsToSave = users.map(user => {
      const oldDocument = oldDocumentMap.has(user.id) ? oldDocumentMap.get(user.id) : undefined;
      const oldWorkingGroup = oldDocument && oldDocument.workingGroup;
      if (oldWorkingGroup) {
        user.workingGroup = {};
        Object.keys(user.group).map(key => {
          const oldValue = oldWorkingGroup[key];
          user.workingGroup[key] = oldValue && user.group[key].includes(oldValue) ? oldValue : user.group[key][0];
        });
      } else {
        user.workingGroup = Object.keys(user.group).reduce((accumulator, value) => {
          accumulator[value] = user.group[value][0];
          return accumulator;
        }, {});
      }
      return user;
    });

    // TODO adding group change scenario logic

    return this.userRepository.save(newDocumentsToSave);
  }

  public async updateWorkingGroup(userId: string, workingGroup: any): Promise<any> {
    this.log.info('Update working group => ', userId, workingGroup);
    const oldDocument = await this.userRepository.findOne({ id: userId });
    Object.keys(workingGroup).forEach(value => {
      oldDocument.group[value] = oldDocument.group[value] || [];
      const groupValue = new Set([...oldDocument.group[value], workingGroup[value]]);
      oldDocument.group[value] = Array.from(groupValue);
    });
    oldDocument.workingGroup = workingGroup;
    return this.userRepository.save(oldDocument);
  }

  public update(id: string, user: ExperimentUser): Promise<ExperimentUser> {
    this.log.info('Update a user => ', user.toString());
    user.id = id;
    return this.userRepository.save(user);
  }
}
