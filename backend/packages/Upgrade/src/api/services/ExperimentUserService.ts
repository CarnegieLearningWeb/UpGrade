import { IndividualEnrollmentRepository } from './../repositories/IndividualEnrollmentRepository';
import { UpgradeLogger } from './../../lib/logger/UpgradeLogger';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE, EXPERIMENT_STATE, SERVER_ERROR } from 'upgrade_types';
import { getConnection, In, Not } from 'typeorm';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Experiment } from '../models/Experiment';

@Service()
export class ExperimentUserService {
  constructor(
    @OrmRepository() private userRepository: ExperimentUserRepository,
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private individualEnrollmentRepository: IndividualEnrollmentRepository,
    @OrmRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository
  ) {}

  public find(logger?: UpgradeLogger): Promise<ExperimentUser[]> {
    if (logger) {
      logger.info({ message: `Find all users` });
    }
    return this.userRepository.find();
  }

  public findOne(id: string, logger: UpgradeLogger): Promise<ExperimentUser> {
    logger.info({ message: `Find user by id => ${id}` });
    return this.userRepository.findOne({ id });
  }

  public async create(users: Array<Partial<ExperimentUser>>, logger: UpgradeLogger): Promise<ExperimentUser[]> {
    logger.info({ message: 'Create a new User. Metadata of the user =>', details: users });
    const multipleUsers = users.map((user) => {
      user.id = user.id;
      return user;
    });
    // insert or update in the database
    const updatedUsers = await this.userRepository.save(multipleUsers);

    // update assignment if user group is changed
    const assignmentUpdated = updatedUsers.map((user: ExperimentUser, index: number) => {
      if (user.group && users[index].group) {
        return this.removeEnrollments(user.id, users[index].group, user.group);
      }
      return Promise.resolve();
    });

    // wait for all assignment update to get complete
    await Promise.all(assignmentUpdated);

    // findAll user document here
    const updatedUserDocument = await this.userRepository.findByIds(updatedUsers.map((user) => user.id));

    return updatedUserDocument;
  }

  public async setAliasesForUser(
    userId: string,
    aliases: string[],
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<ExperimentUser[]> {
    const { logger, userDoc } = requestContext;
    const userExist = userDoc;
    logger.info({ message: 'Set aliases for experiment user => ' + userId, details: aliases });

    // throw error if user not defined
    if (!userExist) {
      logger.error({ message: 'User not defined setAliasesForUser' + userId, details: aliases });
      
      let error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined setAliasesForUser: ${userId}`,
        }));
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404
      throw error;
    }
    const promiseArray = [];
    aliases.map((aliasId) => {
      promiseArray.push(
        this.userRepository.findOne({
          where: { id: aliasId },
          relations: ['originalUser'],
        })
      );
    });
    const promiseResult = await Promise.all(promiseArray);
    const aliasesUserIds = [];
    const aliasesLinkedWithOtherUser = [];
    const otherRootUser = [];
    let alreadyLinkedAliases = [];
    promiseResult.map((result, index) => {
      if (result) {
        if (result.originalUser && result.originalUser.id === userExist.requestedUserId) {
          logger.info({ message: 'User already an alias', details: result });
          // If alias Id is already linked with user
          alreadyLinkedAliases.push(result);
        } else if (result.originalUser && result.originalUser.id !== userExist.requestedUserId) {
          logger.warn({ message: 'User already linked with other user', details: result });
          // If alias Id is associated with other user
          aliasesLinkedWithOtherUser.push(result);
        } else {
          logger.warn({ message: 'User is a rootUser', details: result });
          // If originalUser doesn't exist means this is a rootUser
          otherRootUser.push(result);
        }
      } else {
        // If alias id is not associated with any user
        aliasesUserIds.push(aliases[index]);
      }
    });
    if (aliasesLinkedWithOtherUser.length) {
      const errorToDisplay = aliasesLinkedWithOtherUser.map((result) => {
        return {
          userId: result.id,
          linkedTo: result.originalUser.id,
        };
      });
      const error = new Error(
        `Users already associated with other users ${JSON.stringify(
          errorToDisplay,
          null,
          2
        )} and cannot be made alias of ${userId}`
      );
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }
    if (otherRootUser.length) {
      const error = new Error(
        `Users with ids ${JSON.stringify(
          otherRootUser,
          null,
          2
        )} are root user and should not be converted to an alias of ${userId}`
      );
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }
    const userAliasesDocs = aliasesUserIds.map((aliasId) => {
      const aliasUser: any = {
        id: aliasId,
      };
      aliasUser.originalUser = userExist;
      return aliasUser;
    });
    alreadyLinkedAliases = alreadyLinkedAliases.map((user) => {
      const { originalUser, ...rest } = user;
      return { ...rest, originalUser: originalUser.id };
    });
    if (userAliasesDocs.length) {
      let aliasesUsers = await this.userRepository.save(userAliasesDocs);
      aliasesUsers = aliasesUsers.map((user) => {
        const { originalUser, ...rest } = user;
        return { ...rest, originalUser: originalUser.id };
      });
      return [...aliasesUsers, ...alreadyLinkedAliases];
    }
    return alreadyLinkedAliases;
  }

  public async updateWorkingGroup(
    userId: string,
    workingGroup: any,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<ExperimentUser> {
    const { logger, userDoc } = requestContext;
    let userExist = userDoc;
    logger.info({ message: 'Update working group for user: ' + userId, details: workingGroup });
    if (!userExist) {
      logger.error({ message: 'User not defined updateWorkingGroup', details: userId });
      let error =  new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined updateWorkingGroup: ${userId}`,
        }));
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404
      throw error;
    }
    // TODO check if workingGroup is the subset of group membership
    const newDocument = { ...userExist, workingGroup };
    return this.userRepository.save(newDocument);
  }

  public update(id: string, user: ExperimentUser, logger: UpgradeLogger): Promise<ExperimentUser> {
    logger.info({ message: `Update a user ${user.toString()}` });
    user.id = id;
    return this.userRepository.save(user);
  }

  // TODO should we check for workingGroup as a subset over here?
  public async updateGroupMembership(
    userId: string,
    groupMembership: any,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<ExperimentUser> {
    const { logger, userDoc } = requestContext;
    let userExist = userDoc;
    logger.info({
      message: `Set Group Membership for userId: ${userId} with Group membership details as below:`,
      details: groupMembership,
    });
    if (!userExist) {
      logger.error({ message: 'User not defined updateGroupMembership', details: userId });
      let error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined updateGroupMembership: ${userId}`,
        }));
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404
      throw error;
    }

    // update assignments
    if (userExist && userExist.group) {
      await this.removeEnrollments(userExist.id, groupMembership, userExist.group);
    }

    const newDocument = { ...userExist, group: groupMembership };

    // update group membership
    return this.userRepository.save(newDocument);
  }

  public async getOriginalUserDoc(userId: string, logger?: UpgradeLogger): Promise<ExperimentUser | null> {
    if (logger) {
      logger.info({ message: `Find original user for userId ${userId}` });
    }
    try {
      const userDoc = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['originalUser'],
        cache: 60000
      });

      if (userDoc) {
        if (userDoc.originalUser) {
          // If user is alias user
          return userDoc.originalUser;
        } else {
          // If user is original user
          const { originalUser, ...rest } = userDoc;
          return rest as any;
        }
      } else {
        return null;
      }
    } catch (error) {
      logger.error(error);
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.QUERY_FAILED,
          message: `Error while finding original user for userId ${userId}`,
          details: error,
        })
      );
    }
  }

  public async clearDB(logger: UpgradeLogger): Promise<string> {
    await getConnection().transaction(async (transactionalEntityManager) => {
      await this.experimentRepository.clearDB(transactionalEntityManager, logger);
    });
    return Promise.resolve('Cleared DB');
  }

  private async removeEnrollments(userId: string, groupMembership: any, oldGroupMembership: any): Promise<void> {
    const userGroupRemovedMap: Map<string, string[]> = new Map();

    // check the groups removed from setGroupMembership
    Object.keys(oldGroupMembership).map((key) => {
      const oldGroupArray: string[] = oldGroupMembership[key] || [];
      const newGroupArray: string[] = (groupMembership && groupMembership[key]) || [];
      oldGroupArray.map((groupId) => {
        if (!(newGroupArray && newGroupArray.includes(groupId))) {
          const groupNames = userGroupRemovedMap.has(key) ? userGroupRemovedMap.get(key) : [];
          if (!newGroupArray) {
            userGroupRemovedMap.set(key, [...groupNames, ...newGroupArray]);
          } else {
            userGroupRemovedMap.set(key, [...groupNames, groupId]);
          }
        }
      });
    });

    // get all group experiments
    const groupExperiments = await this.experimentRepository.find({
      where: {
        assignmentUnit: ASSIGNMENT_UNIT.GROUP,
        state: Not(In([EXPERIMENT_STATE.INACTIVE, EXPERIMENT_STATE.PREVIEW, EXPERIMENT_STATE.SCHEDULED])),
      },
    });

    if (groupExperiments.length === 0) {
      return;
    }

    // filter experiment for those groups
    const groupKeys = Array.from(userGroupRemovedMap.keys());

    if (groupKeys.length === 0) {
      return;
    }

    const experimentAssignmentRemovalArray = [];
    // ============       Experiment with Group Consistency
    const filteredGroupExperiment = groupExperiments.filter((experiment) => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.GROUP;
    });
    if (filteredGroupExperiment.length > 0) {
      experimentAssignmentRemovalArray.push(this.groupExperimentsWithGroupConsistency(filteredGroupExperiment, userId));
    }

    const filteredIndividualExperiment = groupExperiments.filter((experiment) => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL;
    });

    if (filteredIndividualExperiment.length > 0) {
      experimentAssignmentRemovalArray.push(
        this.groupExperimentsWithIndividualConsistency(filteredIndividualExperiment, userId)
      );
    }

    const filteredExperimentExperiment = groupExperiments.filter((experiment) => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT;
    });

    if (filteredExperimentExperiment.length > 0) {
      experimentAssignmentRemovalArray.push(
        this.groupExperimentsWithExperimentConsistency(filteredExperimentExperiment, userId)
      );
    }

    await Promise.all(experimentAssignmentRemovalArray);
    return;
  }

  private async groupExperimentsWithGroupConsistency(filteredExperiment: Experiment[], userId: string): Promise<void> {
    const filteredExperimentIds = filteredExperiment.map((experiment) => experiment.id);

    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    const individualAssignments = await this.individualEnrollmentRepository.findEnrollments(
      userId,
      filteredExperimentIds
    );
    const assignedExperimentIds = individualAssignments.map(
      (individualAssignment) => individualAssignment.experiment.id
    );
    if (assignedExperimentIds.length > 0) {
      await this.individualEnrollmentRepository.deleteEnrollmentsOfUserInExperiments(userId, assignedExperimentIds);
    }

    // remove individual exclusion related to that group
    const individualExclusions = await this.individualExclusionRepository.findExcluded(userId, filteredExperimentIds);
    const excludedExperimentIds = individualExclusions.map((individualExclusion) => individualExclusion.experiment.id);

    if (excludedExperimentIds.length > 0) {
      await this.individualExclusionRepository.deleteExperimentsForUserId(userId, excludedExperimentIds);

      // check if other individual exclusions are present for that group
      const otherExclusions = await this.individualExclusionRepository.find({
        where: { experimentId: In(excludedExperimentIds) },
      });
      const otherExcludedExperimentIds = otherExclusions.map((otherExclusion) => otherExclusion.experiment.id);
      // remove group exclusion
      const toRemoveExperimentFromGroupExclusions = otherExcludedExperimentIds.filter((experimentId) => {
        return !otherExcludedExperimentIds.includes(experimentId);
      });
      if (toRemoveExperimentFromGroupExclusions.length > 0) {
        await this.groupExclusionRepository.deleteByExperimentIds(toRemoveExperimentFromGroupExclusions);
      }
    }
  }

  private async groupExperimentsWithIndividualConsistency(
    filteredExperiment: Experiment[],
    userId: string
  ): Promise<void> {
    const filteredExperimentIds = filteredExperiment.map((experiment) => experiment.id);

    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    const individualExclusions = await this.individualExclusionRepository.findExcluded(userId, filteredExperimentIds);

    // remove individual exclusion related to that group
    const excludedExperimentIds = individualExclusions.map((individualExclusion) => individualExclusion.experiment.id);
    if (excludedExperimentIds.length > 0) {
      const otherExclusions = await this.individualExclusionRepository.find({
        where: { experimentId: In(excludedExperimentIds), userId: Not(userId) },
      });
      const otherExcludedExperimentIds = otherExclusions.map((otherExclusion) => otherExclusion.experiment.id);
      // remove group exclusion
      const toRemoveExperimentFromGroupExclusions = otherExcludedExperimentIds.filter((experimentId) => {
        return !otherExcludedExperimentIds.includes(experimentId);
      });
      if (toRemoveExperimentFromGroupExclusions.length > 0) {
        await this.groupExclusionRepository.deleteByExperimentIds(toRemoveExperimentFromGroupExclusions);
      }
    }
  }

  private async groupExperimentsWithExperimentConsistency(
    filteredExperiment: Experiment[],
    userId: string
  ): Promise<void> {
    const filteredExperimentIds = filteredExperiment.map((experiment) => experiment.id);
    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    await this.individualEnrollmentRepository.deleteEnrollmentsOfUserInExperiments(userId, filteredExperimentIds);
  }
}
