import { IndividualEnrollmentRepository } from './../repositories/IndividualEnrollmentRepository';
import { UpgradeLogger } from './../../lib/logger/UpgradeLogger';
import { Service } from 'typedi';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE, EXPERIMENT_STATE, IUserAliases, SERVER_ERROR } from 'upgrade_types';
import { DataSource, In, InsertResult, Not, UpdateResult } from 'typeorm';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Experiment } from '../models/Experiment';
import isEqual from 'lodash/isEqual';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { env } from '../../env';

@Service()
export class ExperimentUserService {
  constructor(
    @InjectRepository() private userRepository: ExperimentUserRepository,
    @InjectRepository() private experimentRepository: ExperimentRepository,
    @InjectRepository() private individualEnrollmentRepository: IndividualEnrollmentRepository,
    @InjectRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository() private groupExclusionRepository: GroupExclusionRepository,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  public find(logger?: UpgradeLogger): Promise<ExperimentUser[]> {
    if (logger) {
      logger.info({ message: `Find all users` });
    }
    return this.userRepository.find();
  }

  public findOne(id: string, logger: UpgradeLogger): Promise<ExperimentUser> {
    logger.info({ message: `Find user by id => ${id}` });
    return this.userRepository.findOneBy({ id });
  }

  public async upsertOnChange(
    oldExperimentUser: RequestedExperimentUser,
    newExperimentUser: Partial<ExperimentUser>,
    logger: UpgradeLogger
  ): Promise<InsertResult | boolean> {
    if (!oldExperimentUser) {
      return this.create([newExperimentUser], logger);
    }

    const isGroupSame = this.isGroupsEqual(oldExperimentUser, newExperimentUser);
    const isWorkingGroupSame =
      (!oldExperimentUser?.workingGroup && !newExperimentUser?.workingGroup) ||
      (oldExperimentUser?.workingGroup &&
        newExperimentUser?.workingGroup &&
        isEqual(oldExperimentUser.workingGroup, newExperimentUser.workingGroup));

    if (!isGroupSame || !isWorkingGroupSame) {
      // update assignment if user working group is changed
      if (!isWorkingGroupSame && oldExperimentUser.workingGroup && newExperimentUser.workingGroup) {
        await this.removeEnrollments(
          newExperimentUser.id,
          newExperimentUser.workingGroup,
          oldExperimentUser.workingGroup
        );
      }

      // update the new user
      return this.create([newExperimentUser], logger);
    }

    return true;
  }

  private isGroupsEqual(oldUserData: RequestedExperimentUser, newUserData: Partial<ExperimentUser>): boolean {
    if (!oldUserData?.group && !newUserData?.group) {
      return true;
    } else if (oldUserData.group && newUserData.group) {
      const oldGroupKeys = Object.keys(oldUserData.group);
      const newGroupKeys = Object.keys(newUserData.group);

      oldGroupKeys.forEach((key) => {
        oldUserData.group[key].sort();
      });
      newGroupKeys.forEach((key) => {
        newUserData.group[key].sort();
      });

      return isEqual(oldUserData.group, newUserData.group);
    } else {
      return false;
    }
  }

  public async create(users: Array<Partial<ExperimentUser>>, logger: UpgradeLogger): Promise<InsertResult> {
    logger.info({ message: 'Create a new User. Metadata of the user =>', details: users });
    // insert or update in the database
    return this.userRepository.upsert(users, ['id']);
  }

  public async setAliasesForUser(
    userDoc: RequestedExperimentUser,
    aliases: string[],
    logger: UpgradeLogger
  ): Promise<IUserAliases> {
    const userId = userDoc.id;
    const userExist = userDoc;
    logger.info({ message: 'Set aliases for experiment user => ' + userId, details: aliases });
    const promiseArray = [];
    const dedupedArray = [...new Set(aliases)];

    dedupedArray.map((aliasId) => {
      promiseArray.push(
        this.userRepository.findOne({
          where: { id: aliasId },
          relations: ['originalUser'],
        })
      );
    });
    const promiseResult = await Promise.all(promiseArray);
    const aliasesUserIds: string[] = [];
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
      return {
        id: aliasId,
        originalUser: userExist,
      };
    });
    alreadyLinkedAliases = alreadyLinkedAliases.map((user) => {
      const { originalUser, ...rest } = user;
      return { ...rest, originalUser: originalUser.id };
    });

    let aliasesToReturn = alreadyLinkedAliases.map((alias) => alias.id);

    if (userAliasesDocs.length) {
      try {
        const insertResponse = await this.userRepository.upsert(userAliasesDocs, ['id']);
        if (!insertResponse) {
          const error = new Error(
            `Error while inserting new aliases for user ${userId}. Aliases: ${JSON.stringify(userAliasesDocs)}`
          );
          (error as any).type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
        aliasesToReturn = [...aliasesToReturn, ...aliasesUserIds];
      } catch (err) {
        logger.error({
          message: `Could not insert new aliases for user ${userId}`,
          details: JSON.stringify(userAliasesDocs),
        });
        const error = new Error(
          JSON.stringify(
            {
              type: SERVER_ERROR.QUERY_FAILED,
              message: `Could not insert new aliases for user ${userId}. Aliases: ${JSON.stringify(userAliasesDocs)}`,
            },
            null,
            2
          )
        );
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
      }
    }
    return { userId, aliases: aliasesToReturn };
  }

  public async updateWorkingGroup(
    userId: string,
    workingGroup: any,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<UpdateResult> {
    const { logger, userDoc } = requestContext;
    const userExist = userDoc;
    logger.info({ message: 'Update working group for user: ' + userId, details: workingGroup });
    // throw error if user not defined
    if (!userDoc) {
      logger.error({ message: `User not found in updateWorkingGroup, userId => ${userId}`, details: workingGroup });
      throw new Error(`User not defined in updateWorkingGroup: ${userId}`);
    }
    // removing enrollments in case working group is changed
    if (userExist && userExist.workingGroup && workingGroup) {
      await this.removeEnrollments(userExist.id, workingGroup, userExist.workingGroup);
    }

    // TODO check if workingGroup is the subset of group membership
    return this.userRepository.update(userId, { workingGroup });
  }

  // TODO should we check for workingGroup as a subset over here?
  public async updateGroupMembership(
    userId: string,
    groupMembership: Record<string, string[]>,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<UpdateResult> {
    const { logger, userDoc } = requestContext;
    logger.info({
      message: `Set Group Membership for userId: ${userId} with Group membership details as below:`,
      details: groupMembership,
    });
    if (!userDoc) {
      logger.error({
        message: `User not found in updateGroupMembership, userId => ${userId}`,
        details: groupMembership,
      });
      throw new Error(`User not defined in updateGroupMembership: ${userId}`);
    }
    // update group membership
    return this.userRepository.update(userId, { group: groupMembership });
  }

  public async getUserDoc(experimentUserId: string, logger: UpgradeLogger): Promise<RequestedExperimentUser> {
    const experimentUserDoc = await this.getOriginalUserDoc(experimentUserId, logger);
    if (experimentUserDoc) {
      const userDoc = { ...experimentUserDoc, requestedUserId: experimentUserId };
      logger.info({ message: 'Got the user doc', details: userDoc });
      return userDoc;
    } else {
      return null;
    }
  }

  public async getOriginalUserDoc(userId: string, logger?: UpgradeLogger): Promise<ExperimentUser | null> {
    if (logger) {
      logger.info({ message: `Find original user for userId ${userId}` });
    }
    try {
      const userDoc = await this.userRepository.find({
        where: { id: userId },
        relations: ['originalUser'],
      });
      if (userDoc.length) {
        if (userDoc[0].originalUser) {
          // If user is alias user
          return userDoc[0].originalUser;
        } else {
          // If user is original user
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { originalUser, ...rest } = userDoc[0];
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
    if (!env.app.demo) {
      return 'DEMO mode is disabled. You cannot clear DB.';
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await this.experimentRepository.clearDB(transactionalEntityManager, logger);
    });

    return 'DB truncate successful';
  }

  /**
   * Remove enrollments only if the working group is changed
   * @param userId
   * @param newWorkingGroup
   * @param oldWorkingGroup
   * return Promise<void>
   */
  private async removeEnrollments(
    userId: string,
    newWorkingGroup: Record<string, string>,
    oldWorkingGroup: Record<string, string>
  ): Promise<void> {
    const workingGroupUpdated: string[] = [];

    // check the groups removed from existing GroupMembership
    // and populate userGroupRemoved
    Object.entries(oldWorkingGroup).map(([key, value]) => {
      const newWorkingGroupValue: string | undefined = newWorkingGroup[key];
      // if the working group value has changed
      if (newWorkingGroupValue !== value) {
        workingGroupUpdated.push(key);
      }
    });

    // End the function if there is no change in working group
    if (workingGroupUpdated.length === 0) {
      return;
    }

    // get all group experiments
    const groupExperiments = await this.experimentRepository.find({
      where: {
        assignmentUnit: ASSIGNMENT_UNIT.GROUP,
        state: In([EXPERIMENT_STATE.ENROLLING, EXPERIMENT_STATE.ENROLLMENT_COMPLETE]),
      },
    });

    // End the function if no group experiments
    if (groupExperiments.length === 0) {
      return;
    }

    const experimentAssignmentRemovalArray = [];

    // Group Experiment with Group Consistency which has group which got removed
    const filteredGroupExperiment = groupExperiments.filter((experiment) => {
      return workingGroupUpdated.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.GROUP;
    });

    if (filteredGroupExperiment.length > 0) {
      experimentAssignmentRemovalArray.push(this.groupExperimentsWithGroupConsistency(filteredGroupExperiment, userId));
    }

    const filteredIndividualExperiment = groupExperiments.filter((experiment) => {
      return (
        workingGroupUpdated.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL
      );
    });

    if (filteredIndividualExperiment.length > 0) {
      experimentAssignmentRemovalArray.push(
        this.groupExperimentsWithIndividualConsistency(filteredIndividualExperiment, userId)
      );
    }

    const filteredExperimentExperiment = groupExperiments.filter((experiment) => {
      return (
        workingGroupUpdated.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT
      );
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
    // end the loop if no group experiments
    if (filteredExperiment.length === 0) {
      return;
    }

    const filteredExperimentIds = filteredExperiment.map((experiment) => experiment.id);

    const [individualEnrollments, individualExclusions] = await Promise.all([
      this.individualEnrollmentRepository.findEnrollments(userId, filteredExperimentIds),
      this.individualExclusionRepository.findExcluded(userId, filteredExperimentIds),
    ]);

    const enrolledExperimentIds = individualEnrollments.map(
      (individualAssignment) => individualAssignment.experimentId
    );
    if (enrolledExperimentIds.length > 0) {
      await this.individualEnrollmentRepository.deleteEnrollmentsOfUserInExperiments(userId, enrolledExperimentIds);
    }

    // remove individual exclusion related to that group
    const excludedExperimentIds = individualExclusions.map((individualExclusion) => individualExclusion.experimentId);

    if (excludedExperimentIds.length > 0) {
      await this.individualExclusionRepository.deleteExperimentsForUserId(userId, excludedExperimentIds);

      // check if other individual exclusions are present for that group
      const otherExclusions = await this.individualExclusionRepository.find({
        where: { experimentId: In(excludedExperimentIds) },
      });
      const otherExcludedExperimentIds = otherExclusions.map((otherExclusion) => otherExclusion.experimentId);
      // remove group exclusion
      const toRemoveExperimentFromGroupExclusions = excludedExperimentIds.filter((experimentId) => {
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
    const excludedExperimentIds = individualExclusions.map((individualExclusion) => individualExclusion.experimentId);

    if (excludedExperimentIds.length > 0) {
      await this.individualExclusionRepository.deleteExperimentsForUserId(userId, excludedExperimentIds);

      const otherExclusions = await this.individualExclusionRepository.find({
        where: { experimentId: In(excludedExperimentIds), userId: Not(userId) },
      });
      const otherExcludedExperimentIds = otherExclusions.map((otherExclusion) => otherExclusion.experimentId);
      // remove group exclusion
      const toRemoveExperimentFromGroupExclusions = excludedExperimentIds.filter((experimentId) => {
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

  /**
   * Creates a minimal user record with only an ID if the user doesn't exist in the database.
   *
   * WARNING: This method is specifically designed for internal use by services that need to
   * ensure foreign key constraints are satisfied (e.g., feature flag exposure tracking).
   * It creates "stub" records with minimal data and should NOT be used for general user creation.
   *
   * For normal user creation, use the create() method instead.
   *
   * @param userId - The user ID to create a stub record for
   * @param logger - Logger instance for tracking operations
   * @returns Promise<boolean> - true if user was created, false if user already existed
   */
  public async createGrouplessUserRecordIfNotExists(userId: string, logger: UpgradeLogger): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.getOriginalUserDoc(userId, logger);

      if (existingUser) {
        logger.debug({
          message: 'User already exists, no stub record needed',
          userId: userId,
        });
        return;
      }

      // Create minimal stub record with only the ID
      const grouplessUser: Partial<ExperimentUser> = {
        id: userId,
      };

      await this.create([grouplessUser], logger);

      logger.info({
        message: 'Created stub user record for foreign key constraint satisfaction',
        userId: userId,
      });
    } catch (error) {
      logger.warn({
        message: 'Failed to create stub user record, foreign key constraints may fail',
        userId: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - let the calling service handle the constraint failure gracefully
    }
  }
}
