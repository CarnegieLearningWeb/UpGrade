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

  public create(users: Array<Partial<ExperimentUser>>): Promise<ExperimentUser[]> {
    this.log.info('Create a new user => ', users.toString());
    const multipleUsers = users.map(user => {
      user.id = user.id || uuid();
      return user;
    });
    return this.userRepository.save(multipleUsers);
  }

  public async updateWorkingGroup(userId: string, workingGroup: any): Promise<any> {
    this.log.info('Update working group => ', userId, workingGroup);
    return this.userRepository.updateWorkingGroup(userId, workingGroup);
  }

  public update(id: string, user: ExperimentUser): Promise<ExperimentUser> {
    this.log.info('Update a user => ', user.toString());
    user.id = id;
    return this.userRepository.save(user);
  }

  public async setGroupMembership(userId: string, groupMembership: any): Promise<ExperimentUser> {
    this.log.info(
      `Set Group Membership => userId ${userId} and Group membership ${JSON.stringify(groupMembership, undefined, 2)}`
    );

    const userGroupRemovedMap: Map<string, string[]> = new Map();

    // check the groups removed from setGroupMembership
    const oldDocument = await this.userRepository.findOne({ id: userId });
    if (oldDocument) {
      Object.keys(oldDocument.group).map(key => {
        const oldGroupArray: string[] = oldDocument.group[key];
        const newGroupArray: string[] = groupMembership[key];
        oldGroupArray.map(groupId => {
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
    }

    // get all group experiments
    const groupExperiments = await this.experimentRepository.find({
      where: {
        assignmentUnit: ASSIGNMENT_UNIT.GROUP,
        state: Not(In([EXPERIMENT_STATE.INACTIVE, EXPERIMENT_STATE.PREVIEW, EXPERIMENT_STATE.SCHEDULED])),
      },
    });

    if (groupExperiments.length === 0) {
      return this.userRepository.updateGroupMembership(userId, groupMembership);
    }

    // filter experiment for those groups
    const groupKeys = Array.from(userGroupRemovedMap.keys());
    // ============       Experiment with Group Consistency
    const filteredGroupExperiment = groupExperiments.filter(experiment => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.GROUP;
    });

    await this.groupExperimentsWithGroupConsistency(filteredGroupExperiment, userId);

    const filteredIndividualExperiment = groupExperiments.filter(experiment => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL;
    });

    await this.groupExperimentsWithIndividualConsistency(filteredIndividualExperiment, userId);

    const filteredExperimentExperiment = groupExperiments.filter(experiment => {
      return groupKeys.includes(experiment.group) && experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT;
    });

    await this.groupExperimentsWithExperimentConsistency(filteredExperimentExperiment, userId);

    return this.userRepository.updateGroupMembership(userId, groupMembership);
  }

  private async groupExperimentsWithGroupConsistency(filteredExperiment: Experiment[], userId: string): Promise<void> {
    const filteredExperimentIds = filteredExperiment.map(experiment => experiment.id);

    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      filteredExperimentIds
    );
    const assignedExperimentIds = individualAssignments.map(individualAssignment => individualAssignment.experimentId);
    if (assignedExperimentIds.length > 0) {
      await this.individualAssignmentRepository.deleteExperimentsForUserId(userId, assignedExperimentIds);
    }

    // remove individual exclusion related to that group
    const individualExclusions = await this.individualExclusionRepository.findExcluded(userId, filteredExperimentIds);
    const excludedExperimentIds = individualExclusions.map(individualExclusion => individualExclusion.experimentId);

    if (excludedExperimentIds.length > 0) {
      await this.individualExclusionRepository.deleteExperimentsForUserId(userId, excludedExperimentIds);

      // check if other individual exclusions are present for that group
      const otherExclusions = await this.individualExclusionRepository.find({
        where: { experimentId: In(excludedExperimentIds) },
      });
      const otherExcludedExperimentIds = otherExclusions.map(otherExclusion => otherExclusion.experimentId);
      // remove group exclusion
      const toRemoveExperimentFromGroupExclusions = otherExcludedExperimentIds.filter(experimentId => {
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
    const filteredExperimentIds = filteredExperiment.map(experiment => experiment.id);

    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      filteredExperimentIds
    );
    individualAssignments.map(individualAssignment => individualAssignment.experimentId);

    // remove individual exclusion related to that group
    const individualExclusions = await this.individualExclusionRepository.findExcluded(userId, filteredExperimentIds);
    const excludedExperimentIds = individualExclusions.map(individualExclusion => individualExclusion.experimentId);
    if (excludedExperimentIds.length > 0) {
      const otherExclusions = await this.individualExclusionRepository.find({
        where: { experimentId: In(excludedExperimentIds), userId: Not(userId) },
      });
      const otherExcludedExperimentIds = otherExclusions.map(otherExclusion => otherExclusion.experimentId);
      // remove group exclusion
      const toRemoveExperimentFromGroupExclusions = otherExcludedExperimentIds.filter(experimentId => {
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
    const filteredExperimentIds = filteredExperiment.map(experiment => experiment.id);
    if (filteredExperimentIds.length === 0) {
      return;
    }

    // remove individual assignment related to that group
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      filteredExperimentIds
    );
    const assignedExperimentIds = individualAssignments.map(individualAssignment => individualAssignment.experimentId);
    if (assignedExperimentIds.length > 0) {
      await this.individualAssignmentRepository.deleteExperimentsForUserId(userId, assignedExperimentIds);
    }
  }
}
