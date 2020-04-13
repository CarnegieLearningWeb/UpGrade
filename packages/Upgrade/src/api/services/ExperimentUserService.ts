import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentUser } from '../models/ExperimentUser';
import uuid from 'uuid/v4';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { ASSIGNMENT_UNIT, CONSISTENCY_RULE, EXPERIMENT_STATE } from 'ees_types';
import { IndividualAssignmentRepository } from '../repositories/IndividualAssignmentRepository';
import { In, Not } from 'typeorm';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Experiment } from '../models/Experiment';

@Service()
export class ExperimentUserService {
  constructor(
    @OrmRepository() private userRepository: ExperimentUserRepository,
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository() private individualAssignmentRepository: IndividualAssignmentRepository,
    @OrmRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
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

  public async create(users: Array<Partial<ExperimentUser>>): Promise<ExperimentUser[]> {
    this.log.info('Create a new user => ', users.toString());
    const multipleUsers = users.map((user) => {
      user.id = user.id || uuid();
      return user;
    });
    // insert or update in the database
    const updatedUsers = await this.userRepository.save(multipleUsers);

    // update assignment if user group is changed
    const assignmentUpdated = updatedUsers.map((user: ExperimentUser, index: number) => {
      if (user.group && users[index].group) {
        return this.removeAssignments(user.id, users[index].group, user.group);
      }
      return Promise.resolve();
    });

    // wait for all assignment update to get complete
    await Promise.all(assignmentUpdated);
    return updatedUsers;
  }

  public async updateWorkingGroup(userId: string, workingGroup: any): Promise<ExperimentUser> {
    this.log.info('Update working group => ', userId, workingGroup);
    const userExist = await this.userRepository.findOne({ id: userId });

    // TODO check if workingGroup is the subset of group membership
    const newDocument = userExist ? { ...userExist, id: userId, workingGroup } : { id: userId, workingGroup };
    return this.userRepository.save(newDocument);
  }

  public update(id: string, user: ExperimentUser): Promise<ExperimentUser> {
    this.log.info('Update a user => ', user.toString());
    user.id = id;
    return this.userRepository.save(user);
  }

  // TODO should we check for workingGroup as a subset over here?
  public async updateGroupMembership(userId: string, groupMembership: any): Promise<ExperimentUser> {
    this.log.info(
      `Set Group Membership => userId ${userId} and Group membership ${JSON.stringify(groupMembership, undefined, 2)}`
    );

    const userExist = await this.userRepository.findOne({ id: userId });

    // update assignments
    if (userExist && userExist.group) {
      await this.removeAssignments(userId, groupMembership, userExist.group);
    }

    const newDocument = userExist
      ? { ...userExist, id: userId, group: groupMembership }
      : { id: userId, group: groupMembership };

    // update group membership
    return this.userRepository.save(newDocument);
  }

  private async removeAssignments(userId: string, groupMembership: any, oldGroupMembership: any): Promise<void> {
    const userGroupRemovedMap: Map<string, string[]> = new Map();

    // check the groups removed from setGroupMembership
    Object.keys(oldGroupMembership).map((key) => {
      const oldGroupArray: string[] = oldGroupMembership[key] || [];
      const newGroupArray: string[] = groupMembership[key] || [];
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

    experimentAssignmentRemovalArray.push(this.groupExperimentsWithGroupConsistency(filteredGroupExperiment, userId));

    const filteredIndividualExperiment = groupExperiments.filter((experiment) => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL;
    });

    experimentAssignmentRemovalArray.push(
      this.groupExperimentsWithIndividualConsistency(filteredIndividualExperiment, userId)
    );

    const filteredExperimentExperiment = groupExperiments.filter((experiment) => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT;
    });

    experimentAssignmentRemovalArray.push(
      this.groupExperimentsWithExperimentConsistency(filteredExperimentExperiment, userId)
    );

    await Promise.all(experimentAssignmentRemovalArray);
    return;
  }

  private async groupExperimentsWithGroupConsistency(filteredExperiment: Experiment[], userId: string): Promise<void> {
    const filteredExperimentIds = filteredExperiment.map((experiment) => experiment.id);

    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      filteredExperimentIds
    );
    const assignedExperimentIds = individualAssignments.map(
      (individualAssignment) => individualAssignment.experiment.id
    );
    if (assignedExperimentIds.length > 0) {
      await this.individualAssignmentRepository.deleteExperimentsForUserId(userId, assignedExperimentIds);
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
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      filteredExperimentIds
    );
    individualAssignments.map((individualAssignment) => individualAssignment.experiment.id);

    // remove individual exclusion related to that group
    const individualExclusions = await this.individualExclusionRepository.findExcluded(userId, filteredExperimentIds);
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
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      filteredExperimentIds
    );
    const assignedExperimentIds = individualAssignments.map(
      (individualAssignment) => individualAssignment.experiment.id
    );
    if (assignedExperimentIds.length > 0) {
      await this.individualAssignmentRepository.deleteExperimentsForUserId(userId, assignedExperimentIds);
    }
  }
}
