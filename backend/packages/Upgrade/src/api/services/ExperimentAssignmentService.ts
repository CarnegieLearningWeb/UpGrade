import { GroupEnrollmentRepository } from './../repositories/GroupEnrollmentRepository';
import { IndividualEnrollmentRepository } from './../repositories/IndividualEnrollmentRepository';
import { IndividualEnrollment } from './../models/IndividualEnrollment';
import { ErrorWithType } from './../errors/ErrorWithType';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { DecisionPoint } from '../models/DecisionPoint';
import { DecisionPointRepository } from '../repositories/DecisionPointRepository';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
  SERVER_ERROR,
  FILTER_MODE,
  EXCLUSION_CODE,
  MARKED_DECISION_POINT_STATUS,
  EXPERIMENT_TYPE,
  SUPPORTED_CALIPER_PROFILES,
  SUPPORTED_CALIPER_EVENTS,
  IExperimentAssignmentv5,
  CACHE_PREFIX,
  ASSIGNMENT_ALGORITHM,
} from 'upgrade_types';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Service } from 'typedi';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupExclusion } from '../models/GroupExclusion';
import { Experiment } from '../models/Experiment';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { v4 as uuid } from 'uuid';
import { PreviewUserService } from './PreviewUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentService } from './ExperimentService';
import { PreviewUser } from '../models/PreviewUser';
import { ExperimentUserService } from './ExperimentUserService';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { ExperimentError } from '../models/ExperimentError';
import { ErrorService } from './ErrorService';
import { Log } from '../models/Log';
import { LogRepository } from '../repositories/LogRepository';
import { MetricRepository } from '../repositories/MetricRepository';
import { Metric } from '../models/Metric';
import { METRICS_JOIN_TEXT } from './MetricService';
import { SettingService } from './SettingService';
import isequal from 'lodash.isequal';
import flatten from 'lodash.flatten';
import { ILogInput, ENROLLMENT_CODE } from 'upgrade_types';
import { StateTimeLogsRepository } from '../repositories/StateTimeLogsRepository';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SegmentService } from './SegmentService';
import {
  MonitoredDecisionPointLogDataCount,
  MonitoredDecisionPointLogRepository,
} from '../repositories/MonitoredDecisionPointLogRepository';
import seedrandom from 'seedrandom';
import { GroupEnrollment } from '../models/GroupEnrollment';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { CaliperLogData } from '../controllers/validators/CaliperLogData';
import { parse, toSeconds } from 'iso8601-duration';
import { FactorDTO } from '../DTO/FactorDTO';
import { ConditionPayloadDTO } from '../DTO/ConditionPayloadDTO';
import { withInSubjectType } from '../Algorithms';
import { CacheService } from './CacheService';
import { UserStratificationFactorRepository } from '../repositories/UserStratificationRepository';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';
import { In } from 'typeorm';
import { env } from '../../env';
import { MoocletExperimentService } from './MoocletExperimentService';
import { MoocletRewardsService } from './MoocletRewardsService';

export interface FactorialConditionResult {
  factorialCondition: Omit<ExperimentCondition, 'levelCombinationElements' | 'conditionPayloads'>;
  payloads: string[];
  assignedFactor: Record<string, { level: string; payload: { type: string; value: any } }>;
  conditionPayload: any | null;
}

@Service()
export class ExperimentAssignmentService {
  constructor(
    @InjectRepository()
    private experimentRepository: ExperimentRepository,
    @InjectRepository()
    private decisionPointRepository: DecisionPointRepository,
    @InjectRepository()
    private individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository()
    private groupExclusionRepository: GroupExclusionRepository,
    // @InjectRepository()
    // private groupAssignmentRepository: GroupAssignmentRepository,
    @InjectRepository()
    private groupEnrollmentRepository: GroupEnrollmentRepository,
    // @InjectRepository()
    // private individualAssignmentRepository: IndividualAssignmentRepository,
    @InjectRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    @InjectRepository()
    private monitoredDecisionPointLogRepository: MonitoredDecisionPointLogRepository,
    @InjectRepository()
    private monitoredDecisionPointRepository: MonitoredDecisionPointRepository,
    @InjectRepository()
    private errorRepository: ErrorRepository,
    @InjectRepository()
    private logRepository: LogRepository,
    @InjectRepository()
    private metricRepository: MetricRepository,
    @InjectRepository()
    private stateTimeLogsRepository: StateTimeLogsRepository,
    @InjectRepository()
    private analyticsRepository: AnalyticsRepository,
    @InjectRepository()
    private userStratificationFactorRepository: UserStratificationFactorRepository,

    public previewUserService: PreviewUserService,
    public experimentUserService: ExperimentUserService,
    public errorService: ErrorService,
    public settingService: SettingService,
    public segmentService: SegmentService,
    public experimentService: ExperimentService,
    public cacheService: CacheService,
    public moocletExperimentService: MoocletExperimentService,
    public moocletRewardsService: MoocletRewardsService
  ) {}

  private async getCachedExperiments(site: string, target: string): Promise<[DecisionPoint[], Experiment[]]> {
    const cacheKey = CACHE_PREFIX.MARK_KEY_PREFIX + '-' + site + '-' + target;
    const dpExperiments = await this.cacheService.wrap(cacheKey, () =>
      this.decisionPointRepository.find({
        where: {
          site: site,
          target: target,
        },
        relations: [
          'experiment',
          'experiment.conditions',
          'experiment.conditions.conditionPayloads',
          'experiment.partitions',
          'experiment.experimentSegmentInclusion',
          'experiment.experimentSegmentExclusion',
          'experiment.experimentSegmentInclusion.segment',
          'experiment.experimentSegmentExclusion.segment',
          'experiment.experimentSegmentInclusion.segment.subSegments',
          'experiment.experimentSegmentExclusion.segment.subSegments',
        ],
      })
    );

    return [dpExperiments, dpExperiments.map((dp) => dp.experiment)];
  }

  public async markExperimentPoint(
    userDoc: RequestedExperimentUser,
    site: string,
    status: MARKED_DECISION_POINT_STATUS | undefined,
    condition: string | null,
    logger: UpgradeLogger,
    experimentId: string,
    target?: string,
    uniquifier?: string,
    clientError?: string
  ): Promise<Omit<MonitoredDecisionPoint, 'createdAt | updatedAt | versionNumber'>> {
    /** Below are the detailed steps for the assignment process:
     * 1. Search decision points in experiments cache and return relevant experiments and decisionPoints data
     * 2. Check if user or group is globally excluded
     * 3. Check for experiment level inclusion and exclusion
     * 4. Store indirect group exclusion documents
     * 5. Storing relevant enrollment/exclusion documents and check for enrollment ending criteria
     * 6. Storing new/updated monitored decision point document and store each monitored log document
     */

    // check error from client side
    if (clientError) {
      const error = new Error(clientError);
      (error as any).type = SERVER_ERROR.REPORTED_ERROR;
      logger.error(error);
    }

    const userId = userDoc.id;
    const previewUser: PreviewUser = await this.previewUserService.findOneFromCache(userId, logger);
    const { workingGroup } = userDoc;

    // 1. Search decision points in experiments cache and return relevant experiments and decisionPoints data
    const experimentsResult = await this.getCachedExperiments(site, target);
    const dpExperiments = experimentsResult[0];
    let experiments = experimentsResult[1];

    logger.info({
      message: `markExperimentPoint: Site: ${site}, Target: ${target}, Condition: ${condition}, Status: "${status}" for User: ${userId}`,
    });

    if (experiments.length) {
      if (experimentId) {
        const dpExpExists = experiments.filter((exp) => exp.id === experimentId);

        if (!dpExpExists.length) {
          const error = new Error(
            `Experiment ID not provided for shared Decision Point in markExperimentPoint: ${userId}`
          );
          (error as any).type = SERVER_ERROR.INVALID_EXPERIMENT_ID_FOR_SHARED_DECISIONPOINT;
          (error as any).httpCode = 404;
          logger.error(error);
          throw error;
        }
        experiments = dpExpExists;
      } else {
        const random = seedrandom(userId)();
        experiments = [experiments[Math.floor(random * experiments.length)]];
        experimentId = experiments[0]?.id;
      }
    }

    // We are sure that either experiment length will not be greater than 1
    const context: string | null = experiments?.[0]?.context?.[0] ?? null;

    // 2. Check if user or group is globally excluded
    const [isUserExcluded, isGroupExcluded] = await this.checkUserOrGroupIsGloballyExcluded(userDoc, context);

    // empty assignments if the user or group is excluded from the experiment
    if (isUserExcluded || isGroupExcluded) {
      experiments = [];
    }

    const experimentIds = experiments.map((experiment) => experiment.id);

    // no experiments
    if (experimentIds.length === 0) {
      experiments = [];
    }

    // 3. Check for experiment level inclusion and exclusion
    const [, exclusionReason] = await this.experimentLevelExclusionInclusion(experiments, userDoc);

    // find monitored document
    let monitoredDocument: MonitoredDecisionPoint = await this.monitoredDecisionPointRepository.findOne({
      where: {
        site: site,
        target: target,
        user: { id: userDoc.id },
      },
    });

    // 4. Store indirect group exclusion documents (if exclusion has consistency-group, exclude direct group of user belongs)
    if (exclusionReason.length && exclusionReason[0].reason === 'group' && !exclusionReason[0].matchedGroup) {
      await this.saveGroupExclusionDoc(exclusionReason, userDoc);
    }

    if (experiments.length) {
      const selectedExperimentDP = dpExperiments.find((dp) => dp.experiment.id === experimentId);
      const experiment = experiments[0];
      const { conditions } = experiment;
      const payloadCondition = conditions.flatMap((condition) => condition.conditionPayloads);

      const matchedCondition = conditions.filter((dbCondition) => dbCondition.conditionCode === condition);
      const matchedPayloadCondition = payloadCondition.filter((con) => con.payloadValue === condition);
      if (matchedCondition.length === 0 && matchedPayloadCondition.length === 0 && condition !== null) {
        const error = new Error(`Condition not found: ${condition}`);
        (error as any).type = SERVER_ERROR.CONDITION_NOT_FOUND;
        logger.error(error);
        throw error;
      }

      // 5. Storing relevant enrollment/exclusion documents and check for enrollment ending criteria
      if (
        (experiment.state === EXPERIMENT_STATE.ENROLLING ||
          experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) &&
        !previewUser
      ) {
        await this.updateEnrollmentExclusionDocumentsAndCheckEndingCriteria(
          selectedExperimentDP,
          userDoc,
          experiment,
          workingGroup,
          isUserExcluded,
          isGroupExcluded,
          exclusionReason,
          status,
          condition,
          logger
        );
      }
    }

    // 6. Storing new/updated monitored decision point document and store each monitored log document
    const assignmentUnit = experiments
      ? experiments.find((exp) => exp.id === experimentId)?.assignmentUnit || experiments[0]?.assignmentUnit
      : null;
    monitoredDocument = await this.monitoredDecisionPointRepository.saveRawJson({
      id: monitoredDocument?.id || uuid(),
      experimentId: experimentId,
      condition: assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? null : condition,
      user: userDoc,
      site: site,
      target: target,
    });

    const logDocument = await this.monitoredDecisionPointLogRepository.save({
      monitoredDecisionPoint: monitoredDocument,
      condition: assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? condition : null,
      uniquifier: assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS ? uniquifier : null,
    });

    return {
      ...monitoredDocument,
      condition: monitoredDocument.condition || logDocument.condition,
    };
  }

  private async saveGroupExclusionDoc(
    exclusionReason: { experiment: Experiment; reason: string; matchedGroup: boolean }[],
    userDoc: RequestedExperimentUser
  ) {
    const userGroups = Object.values(userDoc.workingGroup);
    // group exclusion doc
    const groupExclusionDocs: Array<Omit<GroupExclusion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>> =
      userGroups.map((groupId) => {
        return {
          experiment: exclusionReason[0].experiment,
          groupId,
          exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC,
        };
      });
    await this.groupExclusionRepository.saveRawJson(groupExclusionDocs);
  }

  public async getAllExperimentConditions(
    experimentUserDoc: RequestedExperimentUser,
    context: string,
    logger: UpgradeLogger
  ): Promise<IExperimentAssignmentv5[]> {
    logger.info({ message: `getAllExperimentConditions: User: ${experimentUserDoc.requestedUserId}` });
    const userId = experimentUserDoc.id;
    const previewUser = await this.previewUserService.findOneFromCache(userId, logger);

    /** Below are the detailed steps for the assignment process:
     * 1. Fetch experiments based on user type & moving conditionPayloads at the root level
     * 2. Check if user or group is globally excluded
     * 3. Filter out valid group experiments that doesn't have invalid group/workingGroup which are not enrolled yet
     * 4. Process assignments and exclusions
     * 5. Process experiment pools and filtered experiments
     * 6. Assign condition from the remaining experiment
     */

    // 1. Fetch experiments based on user type & moving conditionPayloads at the root level
    const experiments: Experiment[] = await this.getExperimentsForUser(previewUser, context);

    // 2. Check if user or group is globally excluded
    const [isUserExcluded, isGroupExcluded] = await this.checkUserOrGroupIsGloballyExcluded(experimentUserDoc, context);

    // return empty assignments if the user or group is excluded from the experiment
    if (isUserExcluded || isGroupExcluded) {
      return [];
    }

    // 3. Filter out valid group experiments that doesn't have invalid group/workingGroup which are not enrolled yet
    const validExperiments = await this.filterAndProcessGroupExperiments(experiments, experimentUserDoc, logger);

    // 4. Process assignments and exclusions
    try {
      // return empty assignments if there are no valid experiments
      if (validExperiments.length === 0) {
        return [];
      }

      const experimentIds = validExperiments.map((experiment) => experiment.id);

      // Query assignments and exclusions for the user
      const [individualEnrollments, groupEnrollments, individualExclusions, groupExclusions] =
        await this.getAssignmentsAndExclusionsForUser(experimentUserDoc, experimentIds);

      let mergedIndividualAssignment = individualEnrollments;
      // add assignments for individual assignments if preview user
      if (previewUser && previewUser.assignments) {
        const previewAssignment: IndividualEnrollment[] = previewUser.assignments.map((assignment) => {
          return {
            user: experimentUserDoc,
            condition: assignment.experimentCondition,
            ...assignment,
          } as any; // any is used because we don't have decisionPoint in the preview assignment
        });
        mergedIndividualAssignment = [...previewAssignment, ...mergedIndividualAssignment];
      }

      // Check for experiment level inclusion and exclusion and return valid inclusion experiments
      let [filteredExperiments] = await this.experimentLevelExclusionInclusion(validExperiments, experimentUserDoc);

      // 5. Process experiment pools on filtered experiments
      filteredExperiments = this.processExperimentPools(
        filteredExperiments,
        mergedIndividualAssignment,
        groupEnrollments,
        experimentUserDoc
      );

      // return empty if no experiments
      if (filteredExperiments.length === 0) {
        return [];
      }

      // 6. Assign condition from the remaining experiment (Use the updated filtered experiments for further processing)
      const experimentAssignment = await Promise.all(
        filteredExperiments.map(async (experiment) => {
          const individualEnrollment = mergedIndividualAssignment.find((assignment) => {
            return assignment.experimentId === experiment.id;
          });

          const groupEnrollment = groupEnrollments.find((assignment) => {
            return (
              assignment.experimentId === experiment.id &&
              assignment.groupId === experimentUserDoc.workingGroup[experiment.group]
            );
          });

          const individualExclusion = individualExclusions.find((exclusion) => {
            return exclusion.experimentId === experiment.id;
          });

          const groupExclusion = groupExclusions.find((exclusion) => {
            return (
              exclusion.experimentId === experiment.id &&
              exclusion.groupId === experimentUserDoc.workingGroup[experiment.group]
            );
          });

          let enrollmentCountPerCondition = null;
          if (experiment.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING) {
            enrollmentCountPerCondition = await this.getEnrollmentCountPerCondition(experiment, userId);
          }
          return await this.assignExperiment(
            experimentUserDoc,
            experiment,
            individualEnrollment,
            groupEnrollment,
            individualExclusion,
            groupExclusion,
            enrollmentCountPerCondition
          );
        })
      );
      let monitoredLogCounts: MonitoredDecisionPointLogDataCount[] = [];
      if (filteredExperiments.some((experiment) => experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS)) {
        const filteredWithinSubjectExperiments = filteredExperiments.filter(
          (experiment) => experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS
        );
        const allWithinSubjectsSites = [];
        const allWithinSubjectsTargets = [];
        filteredWithinSubjectExperiments.forEach((exp) => {
          exp.partitions.forEach((partition) => {
            allWithinSubjectsSites.push(partition.site);
            allWithinSubjectsTargets.push(partition.target);
          });
        });
        monitoredLogCounts = await this.monitoredDecisionPointLogRepository.getAllMonitoredDecisionPointLog(
          userId,
          allWithinSubjectsSites,
          allWithinSubjectsTargets,
          logger
        );
      }

      return filteredExperiments.reduce((accumulator, experiment, index) => {
        const assignment = experimentAssignment[index];
        const { conditionPayloads, type, factors } = this.experimentService.formattingPayload(experiment);

        if (assignment) {
          const decisionPoints = this.mapDecisionPoints(
            experiment,
            assignment,
            userId,
            conditionPayloads,
            type,
            factors,
            monitoredLogCounts,
            logger
          );
          return [...accumulator, ...decisionPoints];
        } else {
          return accumulator;
        }
      }, []);
    } catch (err) {
      const error = err as ErrorWithType;
      error.details = 'Error in assignment';
      error.type = SERVER_ERROR.ASSIGNMENT_ERROR;
      logger.error(error);
      throw error;
    }
  }

  public async updateEnrollmentExclusionDocumentsAndCheckEndingCriteria(
    selectedExperimentDP: DecisionPoint,
    userDoc: RequestedExperimentUser,
    experiment: Experiment,
    workingGroup: Record<string, string>,
    isUserExcluded: boolean,
    isGroupExcluded: boolean,
    exclusionReason: { experiment: Experiment; reason: string; matchedGroup: boolean }[],
    status: MARKED_DECISION_POINT_STATUS | undefined,
    condition: string,
    logger: UpgradeLogger
  ) {
    const decisionPointId = selectedExperimentDP.id;
    let individualEnrollments: IndividualEnrollment;
    let individualExclusions: IndividualExclusion;
    let groupEnrollments: GroupEnrollment | undefined;
    let groupExclusions: GroupExclusion | undefined;
    try {
      [individualEnrollments, individualExclusions, groupEnrollments, groupExclusions] = await Promise.all([
        // query individual assignment for user
        this.individualEnrollmentRepository.findOne({
          where: {
            user: { id: userDoc.id },
            experiment: { id: experiment.id },
            partition: { id: decisionPointId },
          },
        }),
        // query individual exclusion for user
        this.individualExclusionRepository.findOne({
          where: { user: { id: userDoc.id }, experiment: { id: experiment.id } },
        }),
        // query group assignment
        (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
          workingGroup &&
          workingGroup[experiment.group] &&
          this.groupEnrollmentRepository.findOne({
            where: { groupId: workingGroup[experiment.group], experiment: { id: experiment.id } },
          })) ||
          Promise.resolve(undefined),
        // query group exclusion
        (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
          workingGroup &&
          workingGroup[experiment.group] &&
          this.groupExclusionRepository.findOne({
            where: { groupId: workingGroup[experiment.group], experiment: { id: experiment.id } },
          })) ||
          Promise.resolve(undefined),
      ]);
    } catch (error) {
      const err: any = error;
      logger.error(err);
      throw err;
    }
    await this.updateEnrollmentExclusion(
      userDoc,
      experiment,
      selectedExperimentDP,
      {
        individualEnrollment: individualEnrollments,
        individualExclusion: individualExclusions,
        groupEnrollment: groupEnrollments,
        groupExclusion: groupExclusions,
      },
      {
        isUserExcluded: isUserExcluded,
        isGroupExcluded: isGroupExcluded,
      },
      exclusionReason,
      status,
      condition,
      logger
    );
    if (experiment.enrollmentCompleteCondition) {
      await this.checkEnrollmentEndingCriteriaForCount(experiment, logger);
    }
  }

  private async getExperimentsForUser(previewUser: PreviewUser, context: string): Promise<Experiment[]> {
    const experiments = previewUser
      ? await this.experimentRepository.getValidExperimentsWithPreview(context)
      : await this.experimentService.getCachedValidExperiments(context);
    // adding conditionPayloads at the root level instead of inside conditions
    return experiments.map((exp) => this.experimentService.formattingConditionPayload(exp));
  }

  private async filterAndProcessGroupExperiments(
    experiments: Experiment[],
    experimentUser: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Experiment[]> {
    // Filter Experiments that has assignment type as GROUP:
    const groupExperiments = experiments.filter(({ assignmentUnit }) => assignmentUnit === ASSIGNMENT_UNIT.GROUP);

    if (groupExperiments.length > 0) {
      // get invalid group/workingGroup experiments which don't have any enrollments yet:
      const invalidGroupExperiments = await this.getInvalidGroupNotEnrolledExperiments(
        groupExperiments,
        experimentUser,
        logger
      );
      const invalidGroupExperimentIds = invalidGroupExperiments.map((exp) => exp.id);
      // filter out valid group experiments that doesn't have invalid group/workingGroup which are not enrolled yet
      return experiments.filter(({ id }) => !invalidGroupExperimentIds.includes(id));
    }
    return experiments;
  }

  private async getInvalidGroupNotEnrolledExperiments(
    groupExperiments: Experiment[],
    experimentUser: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Experiment[]> {
    // if empty group/workingGroup data:
    const isGroupWorkingGroupMissing =
      !experimentUser.group ||
      !experimentUser.workingGroup ||
      Object.keys(experimentUser.group).length === 0 ||
      Object.keys(experimentUser.workingGroup).length === 0;
    // if group/workingGroup data present, check for invalid group/workingGroup:
    const invalidExperiments = isGroupWorkingGroupMissing
      ? groupExperiments
      : this.experimentsWithInvalidGroupAndWorkingGroup(experimentUser, groupExperiments);

    // return invalid group experiments which are not enrolled yet
    return this.groupExperimentWithoutEnrollments(invalidExperiments, experimentUser, logger);
  }

  private async getAssignmentsAndExclusionsForUser(
    experimentUser: ExperimentUser,
    experimentIds: string[]
  ): Promise<[IndividualEnrollment[], GroupEnrollment[], IndividualExclusion[], GroupExclusion[]]> {
    const allGroupIds: string[] = (experimentUser.workingGroup && Object.values(experimentUser.workingGroup)) || [];
    const [individualEnrollments, groupEnrollments, individualExclusions, groupExclusions] = await Promise.all([
      experimentIds.length > 0
        ? this.individualEnrollmentRepository.findEnrollments(experimentUser.id, experimentIds)
        : Promise.resolve([] as IndividualEnrollment[]),
      allGroupIds.length > 0 && experimentIds.length > 0
        ? this.groupEnrollmentRepository.findEnrollments(allGroupIds, experimentIds)
        : Promise.resolve([] as GroupEnrollment[]),
      experimentIds.length > 0
        ? this.individualExclusionRepository.findExcluded(experimentUser.id, experimentIds)
        : Promise.resolve([] as IndividualExclusion[]),
      allGroupIds.length > 0 && experimentIds.length > 0
        ? this.groupExclusionRepository.findExcluded(allGroupIds, experimentIds)
        : Promise.resolve([] as GroupExclusion[]),
    ]);
    return [individualEnrollments, groupEnrollments, individualExclusions, groupExclusions];
  }

  private processExperimentPools(
    experiments: Experiment[],
    individualEnrollments: IndividualEnrollment[],
    groupEnrollments: GroupEnrollment[],
    experimentUser: ExperimentUser
  ): Experiment[] {
    // Create experiment pool
    const experimentPools = this.createExperimentPool(experiments);

    // Filter pools which are not assigned
    const unassignedPools = experimentPools.filter((pool) => {
      return !pool.some((experiment) => {
        const hasIndividualEnrollment = individualEnrollments.some((enrollment) => {
          return enrollment.experimentId === experiment.id;
        });
        const hasGroupEnrollment = groupEnrollments.some((enrollment) => {
          return (
            enrollment.experimentId === experiment.id &&
            enrollment.groupId === experimentUser.workingGroup[experiment.group]
          );
        });
        return !!(hasIndividualEnrollment || hasGroupEnrollment);
      });
    });

    // Select experiments inside the pools
    const random = seedrandom(experimentUser.id)();
    const newSelectedExperiments = unassignedPools.map((pool) => {
      return pool[Math.floor(random * pool.length)];
    });

    // Create new filtered experiment list
    const priorSelectedExperiments = experimentPools.map((pool) => {
      return pool.filter((experiment) => {
        const individualEnrollment = individualEnrollments.some((enrollment) => {
          return enrollment.experimentId === experiment.id;
        });
        const groupEnrollment = groupEnrollments.some((enrollment) => {
          return (
            enrollment.experimentId === experiment.id &&
            enrollment.groupId === experimentUser.workingGroup[experiment.group]
          );
        });
        return !!(individualEnrollment || groupEnrollment);
      });
    });

    return priorSelectedExperiments.flat().concat(newSelectedExperiments);
  }

  private mapDecisionPoints(
    experiment: Experiment,
    conditionAssigned: ExperimentCondition | undefined,
    userId: string,
    conditionPayloads: ConditionPayloadDTO[],
    type: EXPERIMENT_TYPE,
    factors: FactorDTO[],
    monitoredLogCounts: { site: string; target: string; count: number }[],
    logger: UpgradeLogger
  ): IExperimentAssignmentv5[] {
    return experiment.partitions.map((decisionPoint) => {
      const { target, site } = decisionPoint;

      // Determine payload and factorial object
      const { payloadFound, factorialObject } = this.getPayloadAndFactorialObject(
        conditionAssigned,
        type,
        conditionPayloads,
        decisionPoint,
        factors
      );

      // Log preview state information
      if (experiment.state === EXPERIMENT_STATE.PREVIEW) {
        logger.info({
          message: `getAllExperimentConditions: experiment: ${experiment.name}, user: ${userId}, condition: ${
            conditionAssigned ? conditionAssigned.conditionCode : null
          }`,
        });
      }

      const assignedFactors = factorialObject?.assignedFactor || null;
      const factorialCondition = factorialObject?.factorialCondition || null;
      const assignedConditionToReturn = factorialCondition ||
        conditionAssigned || {
          conditionCode: null,
        };

      if (experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
        const count = monitoredLogCounts.find((log) => log.site === site && log.target === target)?.count || 0;
        return withInSubjectType(experiment, conditionPayloads, site, target, factors, userId, count);
      } else {
        const experimentId = experiment.id;
        return {
          target,
          site,
          assignedCondition: [
            {
              ...assignedConditionToReturn,
              payload: payloadFound?.payload,
              experimentId,
            },
          ],
          assignedFactor: assignedFactors ? [assignedFactors] : null,
          experimentType: experiment.type,
        };
      }
    });
  }

  private getPayloadAndFactorialObject(
    conditionAssigned: ExperimentCondition | undefined,
    type: EXPERIMENT_TYPE,
    conditionPayloads: ConditionPayloadDTO[],
    decisionPoint: DecisionPoint,
    factors: FactorDTO[]
  ): { payloadFound: ConditionPayloadDTO | undefined; factorialObject: any } {
    let payloadFound: ConditionPayloadDTO | undefined;
    let factorialObject: FactorialConditionResult;

    if (conditionAssigned) {
      if (type === EXPERIMENT_TYPE.FACTORIAL) {
        payloadFound = conditionPayloads.find((x) => x.parentCondition.id === conditionAssigned.id);
        factorialObject = this.getFactorialCondition(conditionAssigned, payloadFound, factors);
      } else {
        payloadFound = conditionPayloads.find(
          (x) =>
            x.parentCondition.id === conditionAssigned.id &&
            x.decisionPoint.site === decisionPoint.site &&
            x.decisionPoint.target === decisionPoint.target
        );
      }
    }

    return { payloadFound, factorialObject };
  }

  private createPool(
    decisionPointToStart: string,
    decisionPointExperimentMap: Record<string, Experiment[]>,
    experimentMarked: Experiment[]
  ): Experiment[] {
    let poolExperiments = [];
    const experimentToLoop = decisionPointExperimentMap[decisionPointToStart]
      ? [...decisionPointExperimentMap[decisionPointToStart]]
      : [];
    experimentToLoop.forEach((experiment) => {
      if (!experimentMarked.includes(experiment)) {
        // mark experiment
        experimentMarked.push(experiment);
        poolExperiments.push(experiment);
        experiment.partitions.forEach((partition) => {
          const id = `${partition.site}_${partition.target}`;
          poolExperiments = poolExperiments.concat(this.createPool(id, decisionPointExperimentMap, experimentMarked));
        });
      }
    });
    delete decisionPointExperimentMap[decisionPointToStart];
    return poolExperiments;
  }

  private createExperimentPool(experiments: Experiment[]): Experiment[][] {
    const pool: Experiment[][] = [];

    const decisionPointExperimentMap: Record<string, Experiment[]> = {};

    experiments.forEach((experiment) => {
      experiment.partitions.forEach((partition) => {
        const partitionId = `${partition.site}_${partition.target}`;
        decisionPointExperimentMap[partitionId] = decisionPointExperimentMap[partitionId] || [];
        decisionPointExperimentMap[partitionId].push(experiment);
      });
    });

    while (Object.keys(decisionPointExperimentMap).length > 0) {
      const decisionPointToStart = Object.keys(decisionPointExperimentMap)[0];
      pool.push(this.createPool(decisionPointToStart, decisionPointExperimentMap, []));
    }

    return pool;
  }

  public async checkUserOrGroupIsGloballyExcluded(
    experimentUser: RequestedExperimentUser,
    context?: string
  ): Promise<[boolean, boolean]> {
    const userGroup = Object.keys(experimentUser.workingGroup || {}).map((type: string) => {
      return `${type}_${experimentUser.workingGroup[type]}`;
    });

    if (!context) {
      return [false, false];
    }

    // Fetch the global exclude segment for the context
    const globalExcludeSegment = await this.segmentService.getGlobalExcludeSegmentByContext(context);

    if (!globalExcludeSegment) {
      const error = new Error(`Invalid app context: ${context}`);
      (error as any).type = SERVER_ERROR.INVALID_APP_CONTEXT;
      (error as any).httpCode = 400;
      throw error;
    }

    const excludeData = await this.resolveSegment([globalExcludeSegment.id]);
    //users and groups excluded from GlobalExclude segment
    const userExcluded = excludeData.users.find((userId) => userId === experimentUser.id);
    const groupExcluded =
      userGroup.length > 0
        ? excludeData.groups.filter((group) => userGroup.includes(`${group.type}_${group.groupId}`))
        : excludeData.groups;

    return [userExcluded !== undefined, groupExcluded.length > 0];
  }

  // When browser will be sending the blob data
  public async blobDataLog(
    userDoc: RequestedExperimentUser,
    blobLog: ILogInput[],
    logger: UpgradeLogger
  ): Promise<Log[]> {
    const userId = userDoc.id;
    logger.info({ message: `Add blob data userId ${userId}`, details: blobLog });
    const keyUniqueArray = [];

    // throw error if user not defined
    if (!userDoc) {
      logger.error({ message: `User not found in blobDataLog, userId => ${userId}`, details: blobLog });
      throw new Error(`User not defined in blobDataLog: ${userId}`);
    }

    // extract the array value
    const promise = blobLog.map(async (individualMetrics) => {
      return this.createLog(individualMetrics, keyUniqueArray, userDoc, logger);
    });

    const logsToReturn = await Promise.all(promise);
    return flatten(logsToReturn);
  }

  public async caliperDataLog(
    log: CaliperLogData,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<Log[]> {
    if (log.profile === SUPPORTED_CALIPER_PROFILES.GRADING && log.type === SUPPORTED_CALIPER_EVENTS.GRADE) {
      requestContext.logger.info({ message: 'Starting the Caliper log call for user' });

      const logs: ILogInput = log.generated.attempt.extensions;

      logs.metrics.attributes['duration'] = toSeconds(parse(log.generated.attempt.duration));
      logs.metrics.attributes['scoreGiven'] = log.generated.scoreGiven;

      return this.dataLog(requestContext.userDoc, [logs], requestContext.logger);
    } else {
      const error = new Error(`Unsupported Caliper profile: ${log.profile} or type: ${log.type}`);
      (error as any).type = SERVER_ERROR.UNSUPPORTED_CALIPER;
      (error as any).httpCode = 422;
      throw error;
    }
  }

  public async dataLog(userDoc: RequestedExperimentUser, jsonLog: ILogInput[], logger: UpgradeLogger): Promise<Log[]> {
    if (!userDoc) {
      logger.error({
        message: `User not found or is a preview user in dataLog, userId => ${userDoc.id}`,
        details: jsonLog,
      });
      throw new Error(`User not defined or this is a preview user in dataLog: ${userDoc.id}`);
    }

    const userId = userDoc.id;
    logger.info({ message: `Add data log userId ${userId}`, details: jsonLog });
    const keyUniqueArray: { key: string; uniquifier: string }[] = [];

    if (env.mooclets.enabled) {
      this.moocletRewardsService.parseLogsAndSendPotentialRewards(userDoc, jsonLog, logger);
    }

    // extract the array value
    const promise = jsonLog.map(async (individualMetrics) => {
      return this.createLog(individualMetrics, keyUniqueArray, userDoc, logger);
    });

    const logsToReturn = await Promise.all(promise);
    return flatten(logsToReturn);
  }

  public async clientFailedExperimentPoint(
    reason: string,
    site: string,
    userId: string,
    target: string,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<ExperimentError> {
    const error = new ExperimentError();
    const { logger, userDoc } = requestContext;
    logger.info({ message: `Failed experiment point for userId ${userId}` });

    error.type = SERVER_ERROR.REPORTED_ERROR;
    error.message = JSON.stringify({
      site,
      target,
      userId: userDoc.id,
      reason,
    });
    return this.errorRepository.saveRawJson(error);
  }

  private async groupExperimentWithoutEnrollments(
    experiments: Experiment[],
    experimentUser: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Experiment[]> {
    // fetch individual assignment for group experiments
    const individualEnrollments = await (experiments.length > 0
      ? this.individualEnrollmentRepository.findEnrollments(
          experimentUser.id,
          experiments.map(({ id }) => id)
        )
      : Promise.resolve([]));

    // check assignments for group experiment
    const experimentAssignedIds = individualEnrollments.map((assignment) => {
      return assignment.experimentId;
    });

    // create set of experiment ids
    const groupExperimentAssignedIds = Array.from(new Set(experimentAssignedIds));

    if (groupExperimentAssignedIds.length > 0) {
      logger.warn({
        message: `Experiments Id: ${groupExperimentAssignedIds.join(' ')}
      Experiment already assigned but working group and group data is not properly set`,
      });
    }

    // exclude experiments which are not previously assigned
    const experimentToExclude = experiments.filter((experiment) => {
      return groupExperimentAssignedIds.indexOf(experiment.id) === -1;
    });

    const experimentToExcludeIds = experimentToExclude.map((experiment) => experiment.id);

    // throw error user group not defined and add experiments which are excluded
    experimentToExclude.forEach(({ id, name }) => {
      logger.error({
        message: `Experiment Id: ${id},
      Experiment Name: ${name},
      Group not valid for experiment user
      `,
      });
    });

    // log error if there are group experiments which are not previosly assigned and they are
    // to be excluded from assignment due to working group and group data is not properly set
    if (experimentToExclude.length > 0) {
      logger.error(
        {
          endPoint: '/api/assign',
          errorCode: 417,
          message: `Group not defined for experiment User: ${JSON.stringify(
            { ...experimentUser, experiment: experimentToExcludeIds },
            undefined,
            2
          )}`,
          name: 'Experiment user group not defined',
          type: SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED,
        } as any,
        logger
      );
    }
    return experimentToExclude;
  }

  private experimentsWithInvalidGroupAndWorkingGroup(user: ExperimentUser, experiments: Experiment[]): Experiment[] {
    return experiments.filter((experiment) => {
      const { group } = experiment;
      if (group in user.group && group in user.workingGroup) {
        // filter the invalid experiment for which the user's working group is not present in the user's group
        return !user.group[group].includes(user.workingGroup[group]);
      } else {
        return true;
      }
    });
  }

  private async createLog(
    log: ILogInput,
    keyUniqueArray: { key: string; uniquifier: string }[],
    userDoc: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Log[]> {
    const userId = userDoc.id;
    const {
      timestamp,
      metrics,
      metrics: { groupedMetrics },
    } = log;
    logger.info({ message: `Add data log in createLog: userId => ${userId}`, details: log });
    // Populate attribute and uniquifier for individual metric
    if (metrics && metrics.attributes) {
      // search metrics log with default uniquifier
      keyUniqueArray.push(
        ...Object.keys(metrics.attributes).map((metricKey) => {
          return { key: metricKey, uniquifier: '1' };
        })
      );
    }

    // Populate attribute and key for group metrics
    if (groupedMetrics) {
      logger.info({ message: `Add group metrics userId ${userId}`, details: groupedMetrics });
      // search metrics log with specific uniquifier
      groupedMetrics.forEach(({ groupClass, groupKey, groupUniquifier, attributes }) => {
        if (attributes) {
          const key = `${groupClass}${METRICS_JOIN_TEXT}${groupKey}${METRICS_JOIN_TEXT}`;
          Object.keys(attributes).forEach((metricKey) => {
            keyUniqueArray.push({ key: `${key}${metricKey}`, uniquifier: groupUniquifier });
          });
        }
      });
    }

    // get metrics document
    const metricKeyInQueries =
      keyUniqueArray.length === 0
        ? []
        : await this.metricRepository.findMetricsWithQueries(keyUniqueArray.map(({ key }) => key));

    if (metricKeyInQueries.length === 0) {
      return [];
    }

    const filteredKeyUniqueArray = keyUniqueArray.filter(({ key }) => {
      return metricKeyInQueries.find((doc) => doc.key === key);
    });

    const logGroup = await this.logRepository.getMetricUniquifierData(filteredKeyUniqueArray, userId);
    const mergedLogGroup = logGroup.reduce((prev, curr) => {
      // If it's a duplicate, except the key, add the key to the first entry
      const nearDuplicate = prev.find(
        (logItem) =>
          curr.id === logItem.id &&
          curr.uniquifier === logItem.uniquifier &&
          isequal(curr.data, logItem.data) &&
          new Date(curr.timeStamp).getTime() === new Date(logItem.timeStamp).getTime()
      );
      if (nearDuplicate) {
        const toAdd = { ...curr, key: [curr.key, ...nearDuplicate.key] };
        prev.splice(prev.indexOf(nearDuplicate), 1);
        return [...prev, toAdd];
      }
      return [...prev, { ...curr, key: [curr.key] }];
    }, []);

    const toUpdateLogGroup = [];
    let rawDataLogs = this.createDataLogsFromCLFormat(
      timestamp,
      metrics,
      groupedMetrics,
      metricKeyInQueries,
      userDoc,
      logger
    );

    rawDataLogs.forEach((rawLogs) => {
      const { metrics, data, uniquifier, timeStamp } = rawLogs;

      metrics.forEach((metric, index) => {
        const metricArray = metric.key.split(METRICS_JOIN_TEXT);
        const lastKey = metricArray.pop();
        const logGroupSelected = toUpdateLogGroup.find((logGroupIndividual) => {
          return logGroupIndividual.key.includes(metric.key);
        });

        if (logGroupSelected && uniquifier === logGroupSelected.uniquifier) {
          if (new Date(timeStamp).getTime() >= new Date(logGroupSelected.timeStamp).getTime()) {
            const logGroupSelectedRoot = this.getRootMetric(logGroupSelected.data, metricArray);
            const dataRoot = this.getRootMetric(data, metricArray);
            logGroupSelectedRoot[lastKey] = dataRoot[lastKey];
          }

          // delete metric and data from the logGroup
          const dataRootToDelete = this.getRootMetric(data, metricArray);
          delete dataRootToDelete[lastKey];
          delete metrics[index];
        } else {
          // add log group to toUpdateLogGroup Array
          const toMergeElement = mergedLogGroup.find((mergedLogGroupElement) => {
            return mergedLogGroupElement.key.includes(metric.key);
          });

          if (toMergeElement && uniquifier === toMergeElement.uniquifier) {
            if (new Date(timeStamp).getTime() >= new Date(toMergeElement.timeStamp).getTime()) {
              const toMergeElementRoot = this.getRootMetric(toMergeElement.data, metricArray);
              const dataRoot = this.getRootMetric(data, metricArray);
              toMergeElementRoot[lastKey] = dataRoot[lastKey];
              // toMergeElement.data[metric.key] = data[metric.key];
              toMergeElement.timeStamp = timeStamp;

              toUpdateLogGroup.push(toMergeElement);
            }

            // delete metric and data from the logGroup
            const dataRootToDelete = this.getRootMetric(data, metricArray);
            delete dataRootToDelete[lastKey];
            delete metrics[index];
          }
        }
      });
    });

    // filter rawDataLogs
    rawDataLogs = rawDataLogs.filter(({ metrics }) => {
      const metricArray = metrics.filter((metric) => metric !== null);
      return metricArray.length > 0;
    });

    // metrics to update
    const updateLogGroups = toUpdateLogGroup.map((toUpdateLogs) => {
      return this.logRepository.updateLog(toUpdateLogs.id, toUpdateLogs.data, toUpdateLogs.timeStamp);
    });

    const updatedLog: Log[] = await Promise.all(updateLogGroups);

    let newLogData: Log[] = [];
    // metrics to save
    if (rawDataLogs.length > 0) {
      newLogData = await this.logRepository.save(rawDataLogs);
    }

    return [...updatedLog.flat(), ...newLogData];
  }

  private async getMonitoredDocumentOfExperiment(experimentDoc: Experiment): Promise<MonitoredDecisionPoint[]> {
    // get groupAssignment and individual assignment details
    const decisionPoints = experimentDoc.partitions;
    const individualAssignments = await this.individualEnrollmentRepository.find({
      where: { experiment: { id: experimentDoc.id } },
      relations: ['user'],
    });

    // get the monitored document for all the decisionPoints in the experiment
    const experimentDecisionPointIds = decisionPoints.map(async (decisionPoint) => {
      const target = decisionPoint.target;
      const site = decisionPoint.site;
      const decisionPointId = await this.decisionPointRepository.findOne({
        where: {
          site: site,
          target: target,
        },
      });
      return decisionPointId;
    });

    const monitoredDocumentIds = [];
    individualAssignments.forEach((individualAssignment) => {
      experimentDecisionPointIds.forEach(async (experimentDecisionPointId) => {
        monitoredDocumentIds.push(
          await this.monitoredDecisionPointRepository.findOne({
            where: {
              site: (await experimentDecisionPointId).site,
              target: (await experimentDecisionPointId).target,
              user: { id: individualAssignment.user.id },
            },
          })
        );
      });
    });

    // fetch all the monitored document if exist
    const monitoredDocuments = await this.monitoredDecisionPointRepository.find({
      where: { id: In(monitoredDocumentIds) },
      relations: ['user'],
    });

    return monitoredDocuments;
  }

  /**
   * Check the enrollment complete condition for experiments with ending criteria
   * of group count and participants count defined in experiment
   * experiment - Experiment definition
   */
  private async checkEnrollmentEndingCriteriaForCount(experiment: Experiment, logger: UpgradeLogger): Promise<void> {
    const { enrollmentCompleteCondition } = experiment;
    const { groupCount, userCount } = enrollmentCompleteCondition;
    /**
     * Create stateTimeLog document which will be inserted if ending criteria is met
     */
    const stateTimeLogDoc = await this.experimentService.prepareStateTimeLogDoc(
      experiment,
      experiment.state,
      EXPERIMENT_STATE.ENROLLMENT_COMPLETE
    );

    if (groupCount && userCount && experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
      const groupSatisfied: number = await this.getGroupAssignmentStatus(experiment.id, logger);

      if (groupSatisfied >= groupCount) {
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        await this.stateTimeLogsRepository.save(stateTimeLogDoc);
      }

      const usersPerGroup = await this.analyticsRepository.getEnrollmentCountPerGroup(experiment.id);
      const validGroups = usersPerGroup.filter(({ count }) => count >= userCount);
      if (validGroups.length >= groupCount) {
        await Promise.all([
          this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined),
          this.stateTimeLogsRepository.save(stateTimeLogDoc),
        ]);
      }
    } else if (userCount) {
      const individualEnrollmentNumber = await this.individualEnrollmentRepository.getEnrollmentCountForExperiment(
        experiment.id
      );
      // fetch all the monitored document if exist
      const monitoredDocuments = await this.getMonitoredDocumentOfExperiment(experiment);
      const userIds = monitoredDocuments.map((doc) => {
        return doc.user.id;
      });
      const uniqueUser = new Set(userIds);
      if (uniqueUser.size >= userCount) {
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        await this.stateTimeLogsRepository.save(stateTimeLogDoc);
      }
      if (individualEnrollmentNumber >= userCount) {
        await Promise.all([
          this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined),
          this.stateTimeLogsRepository.save(stateTimeLogDoc),
        ]);
      }
    }
  }

  public async getGroupAssignmentStatus(experimentId: string, logger: UpgradeLogger) {
    const experiment = await this.experimentService.findOne(experimentId, logger);
    if (experiment) {
      if (
        experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
        experiment.enrollmentCompleteCondition &&
        experiment.enrollmentCompleteCondition.groupCount &&
        experiment.enrollmentCompleteCondition.userCount
      ) {
        const { enrollmentCompleteCondition } = experiment;
        const { userCount } = enrollmentCompleteCondition;
        const usersPerGroup = await this.analyticsRepository.getEnrollmentCountPerGroup(experiment.id);

        const groupSatisfied = usersPerGroup.filter(({ count }) => {
          if (count >= userCount) {
            return true;
          }
          return false;
        });

        return groupSatisfied.length;
      }
      return null;
    }
    return undefined;
  }

  private getRootMetric(object: any, keys: string[]): any {
    let rootElement = object;
    keys.forEach((key) => {
      rootElement = rootElement[key];
    });
    return rootElement;
  }

  private createDataLogsFromCLFormat(
    timestamp: string,
    metrics: any,
    groupedMetrics: any,
    metricDocs: Metric[],
    userDoc: ExperimentUser,
    logger: UpgradeLogger
  ): Log[] {
    const dataLogs = [];
    if (metrics && metrics.attributes) {
      const data = {};
      const dataLogMetricsDoc = [];
      Object.keys(metrics.attributes).forEach((key) => {
        const metricDocOfKey = metricDocs.find((metricDocument) => key === metricDocument.key);
        if (metricDocOfKey) {
          dataLogMetricsDoc.push(metricDocOfKey);
          data[key] = metrics.attributes[key];
        }
      });
      if (dataLogMetricsDoc.length > 0) {
        dataLogs.push({
          timeStamp: timestamp,
          uniquifier: '1',
          data,
          metrics: dataLogMetricsDoc,
          user: userDoc,
        });
      }
    }

    // adding group metrics
    if (groupedMetrics) {
      // search metrics log with specific uniquifier
      groupedMetrics.forEach(({ groupClass, groupKey, groupUniquifier, attributes }) => {
        const data = {};
        const dataLogMetricsDoc = [];

        Object.keys(attributes).forEach((metricKey) => {
          const key = `${groupClass}${METRICS_JOIN_TEXT}${groupKey}${METRICS_JOIN_TEXT}${metricKey}`;
          const metricDocOfKey = metricDocs.find((metricDocument) => key === metricDocument.key);
          if (metricDocOfKey) {
            dataLogMetricsDoc.push(metricDocOfKey);
            data[groupClass] = data[groupClass] || {};
            data[groupClass][groupKey] = data[groupClass][groupKey] || {};
            data[groupClass][groupKey][metricKey] = attributes[metricKey];
          }
        });
        if (dataLogMetricsDoc.length > 0) {
          dataLogs.push({
            timeStamp: timestamp,
            uniquifier: groupUniquifier,
            data,
            metrics: dataLogMetricsDoc,
            user: userDoc,
          });
        }
      });
    }
    logger.info({ message: 'data logs created in createDataLogsFromCLFormat', details: dataLogs });
    return dataLogs;
  }

  private async updateEnrollmentExclusion(
    user: ExperimentUser,
    experiment: Experiment,
    decisionPoint: DecisionPoint,
    {
      individualEnrollment,
      individualExclusion,
      groupEnrollment,
      groupExclusion,
    }: {
      individualEnrollment: IndividualEnrollment;
      individualExclusion: IndividualExclusion;
      groupEnrollment: GroupEnrollment;
      groupExclusion: GroupExclusion;
    },
    globallyExcluded: { isUserExcluded: boolean; isGroupExcluded: boolean },
    experimentLevelExcluded: { experiment: Experiment; reason: string; matchedGroup: boolean }[],
    status: MARKED_DECISION_POINT_STATUS,
    condition: string,
    logger: UpgradeLogger
  ): Promise<void> {
    const { assignmentUnit, state, consistencyRule } = experiment;
    // experiment level exclusion
    let experimentExcluded = false;
    if (experimentLevelExcluded.length > 0) {
      experimentExcluded = true;
    }

    if (status === MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY) {
      const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
        user,
        experiment,
        exclusionCode: EXCLUSION_CODE.EXCLUDED_BY_CLIENT,
      };
      await this.individualExclusionRepository.saveRawJson([excludeUserDoc]);
      return;
    }

    // Don't mark the experiment if user or group are in exclusion list
    // TODO update this with segment implementation
    // Create the excludeUserDoc outside of the conditional statements to avoid repetition
    const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
      user,
      experiment,
      exclusionCode: EXCLUSION_CODE.PARTICIPANT_ON_EXCLUSION_LIST,
    };
    if (globallyExcluded.isUserExcluded || globallyExcluded.isGroupExcluded) {
      // store Individual exclusion document for the Group Exclusion as well:
      const promiseArray = [];
      promiseArray.push(this.individualExclusionRepository.saveRawJson([excludeUserDoc]));
      if (globallyExcluded.isGroupExcluded) {
        // store Group exclusion document:
        const excludeGroupDoc: Pick<GroupExclusion, 'groupId' | 'experiment' | 'exclusionCode'> = {
          groupId: user?.workingGroup?.[experiment.group],
          experiment,
          exclusionCode: EXCLUSION_CODE.GROUP_ON_EXCLUSION_LIST,
        };
        promiseArray.push(this.groupExclusionRepository.saveRawJson([excludeGroupDoc]));
        // check if excluded group was earlier included, if yes - remove them:
        promiseArray.push(
          this.groupEnrollmentRepository.deleteGroupEnrollment(
            user?.workingGroup?.[experiment.group],
            new UpgradeLogger()
          )
        );
      }
      await Promise.all(promiseArray);
      return;
    } else if (experimentExcluded) {
      // store Individual exclusion document with the Group Exclusion document:
      const promiseArray = [];
      promiseArray.push(this.individualExclusionRepository.saveRawJson([excludeUserDoc]));
      if (experimentLevelExcluded[0].reason === 'group' && experimentLevelExcluded[0].matchedGroup) {
        // store Group exclusion document:
        const excludeGroupDoc: Pick<GroupExclusion, 'groupId' | 'experiment' | 'exclusionCode'> = {
          groupId: user?.workingGroup?.[experiment.group],
          experiment,
          exclusionCode: EXCLUSION_CODE.GROUP_ON_EXCLUSION_LIST,
        };
        promiseArray.push(this.groupExclusionRepository.saveRawJson([excludeGroupDoc]));
        // check if excluded group was earlier included, if yes - remove them:
        promiseArray.push(
          this.groupEnrollmentRepository.deleteGroupEnrollment(
            user?.workingGroup?.[experiment.group],
            new UpgradeLogger()
          )
        );
      }
      await Promise.all(promiseArray);
      return;
    }

    // if group experiment check if group is valid
    let noGroupSpecified = false;
    let invalidGroup = false;
    if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
      // if group or workingGroup is not provided or if group or workingGroup is an empty array:
      if (
        !user.group ||
        !user.workingGroup ||
        (user.group && Object.keys(user.group).length === 0) ||
        (user.workingGroup && Object.keys(user.workingGroup).length === 0)
      ) {
        noGroupSpecified = true;
      } else {
        const experimentWithInvalidGroupOrWorkingGroup = this.experimentsWithInvalidGroupAndWorkingGroup(user, [
          experiment,
        ]);
        if (experimentWithInvalidGroupOrWorkingGroup.length > 0) {
          invalidGroup = true;
        }
      }
    }

    // Populating enrollment and exclusion document
    if (state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE && consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
      const promiseArray = [];
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP && user?.workingGroup?.[experiment.group] && !invalidGroup) {
        if (!groupEnrollment && !groupExclusion) {
          // exclude group here
          const excludeGroupDoc: Pick<GroupExclusion, 'groupId' | 'experiment' | 'exclusionCode'> = {
            groupId: user?.workingGroup?.[experiment.group],
            experiment,
            exclusionCode: EXCLUSION_CODE.REACHED_AFTER,
          };
          promiseArray.push(this.groupExclusionRepository.saveRawJson([excludeGroupDoc]));
        }
      }

      if (!individualEnrollment && !individualExclusion) {
        if (assignmentUnit === ASSIGNMENT_UNIT.GROUP && !groupEnrollment) {
          const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
            user,
            experiment,
            exclusionCode: EXCLUSION_CODE.REACHED_AFTER,
          };
          promiseArray.push(this.individualExclusionRepository.saveRawJson([excludeUserDoc]));
        } else if (assignmentUnit !== ASSIGNMENT_UNIT.GROUP) {
          const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
            user,
            experiment,
            exclusionCode: EXCLUSION_CODE.REACHED_AFTER,
          };
          promiseArray.push(this.individualExclusionRepository.saveRawJson([excludeUserDoc]));
        }
      }
      await Promise.all(promiseArray);
    } else {
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
        const promiseArray = [];
        let conditionAssigned;
        if (!noGroupSpecified && !invalidGroup) {
          if (experiment.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING) {
            conditionAssigned = experiment.conditions.find((expCondition) => expCondition.conditionCode === condition);
          } else {
            conditionAssigned = await this.assignExperiment(
              user,
              experiment,
              individualEnrollment,
              groupEnrollment,
              individualExclusion,
              groupExclusion
            );
          }
        }

        // get condition which should be assigned
        if (!groupEnrollment && !groupExclusion && conditionAssigned && !invalidGroup && !noGroupSpecified) {
          const groupEnrollmentDocument: Omit<GroupEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> = {
            id: uuid(),
            experiment,
            partition: decisionPoint as DecisionPoint,
            groupId: user?.workingGroup?.[experiment.group],
            condition: conditionAssigned,
          };
          promiseArray.push(this.groupEnrollmentRepository.save(groupEnrollmentDocument));
        }

        // TODO check this where is this required
        if (groupExclusion && !individualExclusion && consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
          const individualExclusionDocument: Omit<
            IndividualExclusion,
            'id' | 'createdAt' | 'updatedAt' | 'versionNumber'
          > = {
            experiment,
            user,
            exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC,
          };
          individualExclusion = individualExclusionDocument as IndividualExclusion;
          promiseArray.push(this.individualExclusionRepository.saveRawJson([individualExclusionDocument]));
        }

        if (!individualEnrollment && !individualExclusion && conditionAssigned && !invalidGroup && !noGroupSpecified) {
          const individualEnrollmentDocument: Omit<IndividualEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> =
            {
              id: uuid(),
              experiment,
              partition: decisionPoint as DecisionPoint,
              user,
              condition: conditionAssigned,
              groupId: user?.workingGroup?.[experiment.group],
              enrollmentCode: groupEnrollment ? ENROLLMENT_CODE.GROUP_LOGIC : ENROLLMENT_CODE.ALGORITHMIC,
            };
          promiseArray.push(this.individualEnrollmentRepository.save(individualEnrollmentDocument));
        }

        if (
          !individualEnrollment &&
          !individualExclusion &&
          (invalidGroup || noGroupSpecified) &&
          consistencyRule !== CONSISTENCY_RULE.EXPERIMENT
        ) {
          const individualExclusionDocument: Omit<
            IndividualExclusion,
            'id' | 'createdAt' | 'updatedAt' | 'versionNumber'
          > = {
            experiment,
            user,
            exclusionCode: invalidGroup
              ? EXCLUSION_CODE.INVALID_GROUP_OR_WORKING_GROUP
              : EXCLUSION_CODE.NO_GROUP_SPECIFIED,
          };
          promiseArray.push(this.individualExclusionRepository.saveRawJson([individualExclusionDocument]));
        }
        await Promise.all(promiseArray);
      } else if (experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS && !individualEnrollment) {
        const individualEnrollmentDocument: Omit<IndividualEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> = {
          id: uuid(),
          experiment,
          partition: decisionPoint as DecisionPoint,
          user,
          condition: null,
          enrollmentCode: ENROLLMENT_CODE.ALGORITHMIC,
        };
        await this.individualEnrollmentRepository.save(individualEnrollmentDocument);
      } else {
        let conditionAssigned: ExperimentCondition | void;

        const isMoocletExperiment = this.moocletExperimentService.isMoocletExperiment(experiment.assignmentAlgorithm);

        if (isMoocletExperiment) {
          conditionAssigned = await this.moocletExperimentService.handleEnrollCondition(
            experiment.id,
            condition,
            logger
          );
        } else {
          conditionAssigned = await this.assignExperiment(
            user,
            experiment,
            individualEnrollment,
            groupEnrollment,
            individualExclusion,
            groupExclusion
          );
        }
        if (!individualEnrollment && !individualExclusion && conditionAssigned) {
          const individualEnrollmentDocument: Omit<IndividualEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> =
            {
              id: uuid(),
              experiment,
              partition: decisionPoint as DecisionPoint,
              user,
              condition: conditionAssigned,
              enrollmentCode: ENROLLMENT_CODE.ALGORITHMIC,
            };
          await this.individualEnrollmentRepository.save(individualEnrollmentDocument);
        }
      }
    }
  }

  private async assignExperiment(
    user: ExperimentUser,
    experiment: Experiment,
    individualEnrollment: IndividualEnrollment | undefined,
    groupEnrollment: GroupEnrollment | undefined,
    individualExclusion: IndividualExclusion | undefined,
    groupExclusion: GroupExclusion | undefined,
    enrollmentCount?: { conditionId: string; userCount: number }[],
    logger: UpgradeLogger = new UpgradeLogger('ExperimentAssignmentService: assignExperiment')
  ): Promise<ExperimentCondition | void> {
    const userId = user.id;
    const individualEnrollmentCondition = experiment.conditions.find(
      (condition) =>
        condition.id === individualEnrollment?.conditionId || condition.id === individualEnrollment?.condition?.id
    );
    const groupEnrollmentCondition = experiment.conditions.find(
      (condition) => condition.id === groupEnrollment?.conditionId || condition.id === groupEnrollment?.condition?.id
    );
    if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE && userId) {
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        if (experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
          return individualExclusion
            ? undefined
            : individualEnrollmentCondition
            ? individualEnrollmentCondition
            : groupExclusion
            ? undefined
            : groupEnrollmentCondition;
        } else if (experiment.consistencyRule === CONSISTENCY_RULE.GROUP) {
          return groupExclusion
            ? undefined
            : groupEnrollmentCondition
            ? groupEnrollmentCondition
            : individualExclusion
            ? undefined
            : individualEnrollmentCondition;
        } else {
          return experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL
            ? individualEnrollmentCondition
            : groupEnrollmentCondition;
        }
      } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN) {
        if (!experiment.revertTo) {
          return;
        } else {
          const condition = experiment.conditions.find((key) => key.id === experiment.revertTo);
          return condition;
        }
      }
    } else if (
      (experiment.state === EXPERIMENT_STATE.ENROLLING || experiment.state === EXPERIMENT_STATE.PREVIEW) &&
      userId
    ) {
      if (experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
        return individualExclusion
          ? undefined
          : individualEnrollmentCondition
          ? individualEnrollmentCondition
          : groupExclusion
          ? undefined
          : groupEnrollmentCondition
          ? groupEnrollmentCondition
          : this.getNewExperimentConditionAssignment(experiment, user, logger);
      } else if (experiment.consistencyRule === CONSISTENCY_RULE.GROUP) {
        return groupExclusion
          ? undefined
          : groupEnrollmentCondition
          ? groupEnrollmentCondition
          : individualExclusion
          ? undefined
          : individualEnrollmentCondition
          ? individualEnrollmentCondition
          : this.getNewExperimentConditionAssignment(experiment, user, logger);
      } else {
        return (
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL
            ? individualEnrollmentCondition
            : groupEnrollmentCondition) ||
          this.getNewExperimentConditionAssignment(experiment, user, logger, enrollmentCount)
        );
      }
    }
    return;
  }

  private async getNewExperimentConditionAssignment(
    experiment: Experiment,
    user: ExperimentUser,
    logger: UpgradeLogger,
    enrollmentCount?: { conditionId: string; userCount: number }[]
  ): Promise<ExperimentCondition> {
    const isMoocletExperiment = this.moocletExperimentService.isMoocletExperiment(experiment.assignmentAlgorithm);

    if (isMoocletExperiment && !env.mooclets.enabled) {
      logger.error({
        message: 'Mooclet experiment algorithm is indicated but mooclets are not enabled',
        experiment,
        user,
      });
      return undefined;
    }

    if (isMoocletExperiment && env.mooclets.enabled) {
      return this.getConditionFromMoocletProxy(experiment, user, logger);
    } else {
      return this.assignRandom(experiment, user, enrollmentCount);
    }
  }

  private async getConditionFromMoocletProxy(experiment: Experiment, user: ExperimentUser, logger: UpgradeLogger) {
    const userId = user.id;

    return await this.moocletExperimentService.getConditionFromMoocletProxy(experiment, userId, logger);
  }

  private assignRandom(
    experiment: Experiment,
    user: ExperimentUser,
    enrollmentCount?: { conditionId: string; userCount: number }[]
  ): ExperimentCondition {
    const randomSeed =
      experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL ||
      experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS
        ? `${experiment.id}_${user.id}`
        : `${experiment.id}_${user.workingGroup?.[experiment.group]}`;

    const sortedExperimentCondition = experiment.conditions.sort(
      (condition1, condition2) => condition1.order - condition2.order
    );
    let spec = sortedExperimentCondition.map((condition) => condition.assignmentWeight);

    if (experiment.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING) {
      spec = this.assignStratifiedRandom(sortedExperimentCondition, spec, enrollmentCount || []);
    }
    const r = seedrandom(randomSeed)() * 100;
    let sum = 0;
    let randomConditions = 0;
    for (let i = 0; i < spec.length; i++) {
      sum += spec[i];
      if (r <= sum) {
        randomConditions = i;
        break;
      }
    }
    const experimentalCondition = experiment.conditions[randomConditions];
    return experimentalCondition;
  }

  private assignStratifiedRandom(
    sortedExperimentCondition: ExperimentCondition[],
    originalWeights: number[],
    enrollmentCount: { conditionId: string; userCount: number }[]
  ): number[] {
    const sortedEnrollmentCounts = [];
    sortedExperimentCondition.forEach((condition) => {
      const foundEnrollmentCount = enrollmentCount.find(({ conditionId }) => conditionId === condition.id);
      sortedEnrollmentCounts.push(foundEnrollmentCount?.userCount || 0);
    });

    const adjustedWeights = this.stratifiedConditionsWeight(sortedEnrollmentCounts, originalWeights);
    return adjustedWeights;
  }

  private async resolveSegment(
    segmentIds: string[],
    resolveData = {
      segmentIdsSeen: [],
      users: [],
      groups: [],
    }
  ): Promise<{
    segmentIdsSeen: string[];
    users: string[];
    groups: { type: string; groupId: string }[];
  }> {
    // Reculsively resolves the segments, returning the users and groups of all segments and subsegments
    const segments = (await this.segmentService.getSegmentByIds(segmentIds)) || [];
    return await segments.reduce(async (acc, segment) => {
      const currentData = await acc;
      if (currentData && !currentData.segmentIdsSeen?.includes(segment.id)) {
        currentData.segmentIdsSeen.push(segment.id);
        currentData.users.push(...segment.individualForSegment.map((individual) => individual.userId));
        currentData.groups.push(
          ...segment.groupForSegment.map((group) => ({
            type: group.type,
            groupId: group.groupId,
          }))
        );

        if (segment.subSegments && segment.subSegments.length > 0) {
          const subSegmentIds = segment.subSegments
            .map((seg) => seg.id)
            .filter((seg) => !currentData.segmentIdsSeen?.includes(seg));
          const resolvedThisSegment = await this.resolveSegment(subSegmentIds, currentData);
          return { ...currentData, ...resolvedThisSegment };
        }
      }
      return currentData;
    }, Promise.resolve(resolveData));
  }

  private async experimentLevelExclusionInclusion(
    experiments: Experiment[],
    experimentUser: ExperimentUser
  ): Promise<[Experiment[], { experiment: Experiment; reason: string; matchedGroup: boolean }[]]> {
    const segmentObj = {};

    let includedExperiments: Experiment[] = [];
    let excludedExperiments: { experiment: Experiment; reason: string; matchedGroup: boolean }[] = [];

    const experimentIdsForIndividualConsistency = experiments
      .filter(
        (experiment) =>
          experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL &&
          experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP
      )
      .map((experiment) => experiment.id);
    const experimentsEnrolled = await this.individualEnrollmentRepository.find({
      where: { experimentId: In(experimentIdsForIndividualConsistency), userId: experimentUser.id },
    });
    const experimentsEnrolledIds = experimentsEnrolled.map((enrollment) => enrollment.experimentId);

    // creates segment Object for all experiments
    experiments.forEach((exp) => {
      if (!experimentsEnrolledIds.includes(exp.id)) {
        const includeId = exp.experimentSegmentInclusion.segment.id;
        const excludeId = exp.experimentSegmentExclusion.segment.id;

        segmentObj[exp.id] = {
          segmentIdsQueue: [includeId, excludeId],
          currentIncludedSegmentIds: [includeId],
          currentExcludedSegmentIds: [excludeId],
          allIncludedSegmentIds: [includeId],
          allExcludedSegmentIds: [excludeId],
        };
      }
    });

    const experimentIdsWithFilter: { id: string; filterMode: FILTER_MODE }[] = experiments.map(
      ({ id, filterMode, group }) => ({ id, filterMode, group })
    );

    // runs resolveSegment and inclusionExclusion logic for all experiments
    const [includedExperimentIds, excludedExperimentIds] = await this.inclusionExclusionLogic(
      segmentObj,
      experimentUser,
      experimentIdsWithFilter
    );

    // mapping ids to experiments
    includedExperiments = experiments.filter(({ id }) => includedExperimentIds.includes(id));
    excludedExperiments = excludedExperimentIds.map((expIdWithReason) => {
      return {
        experiment: experiments.find(({ id }) => id === expIdWithReason.id),
        reason: expIdWithReason.reason,
        matchedGroup: expIdWithReason.matchedGroup,
      };
    });

    return [includedExperiments, excludedExperiments];
  }

  public async inclusionExclusionLogic(
    segmentObjMap: object,
    experimentUser: ExperimentUser,
    entityIds: { id: string; filterMode: FILTER_MODE; group?: string }[] // can be experimentIds or FeatureFlagsIds
  ): Promise<[string[], { id: string; reason: string; matchedGroup?: boolean }[]]> {
    const includeData = {};
    const excludeData = {};

    await Promise.all(
      Object.keys(segmentObjMap).map(async (expId) => {
        includeData[expId] = await this.resolveSegment(segmentObjMap[expId].currentIncludedSegmentIds || []);
        excludeData[expId] = await this.resolveSegment(segmentObjMap[expId].currentExcludedSegmentIds || []);
      })
    );
    const explicitIndividualInclusionFilteredData: { userId: string; id: string }[] = [];
    const explicitIndividualExclusionFilteredData: { userId: string; id: string }[] = [];
    const explicitGroupInclusionFilteredData: { groupId: string; type: string; id: string }[] = [];
    const explicitGroupExclusionFilteredData: { groupId: string; type: string; id: string }[] = [];

    const userGroups = [],
      indirectExcludedExperiments = [];
    if (experimentUser.group) {
      Object.keys(experimentUser.group).forEach((type) => {
        experimentUser.group[type].forEach((groupId) => {
          userGroups.push({ type, groupId });
        });
      });
    }

    Object.keys(excludeData).forEach((entityId) => {
      const entitySegment = excludeData[entityId];

      entitySegment.users.forEach((individual) => {
        if (individual === experimentUser.id) {
          explicitIndividualExclusionFilteredData.push({
            userId: individual,
            id: entityId,
          });
        }
      });

      entitySegment.groups.forEach((group) => {
        if (userGroups.some((userGroup) => userGroup.groupId === group.groupId && userGroup.type === group.type)) {
          explicitGroupExclusionFilteredData.push({
            groupId: group.groupId,
            type: group.type,
            id: entityId,
          });
        }
      });
    });

    Object.keys(includeData).forEach((entityId) => {
      const entitySegment = includeData[entityId];
      entitySegment.users.forEach((individual) => {
        if (individual === experimentUser.id) {
          explicitIndividualInclusionFilteredData.push({
            userId: individual,
            id: entityId,
          });
        }
      });

      entitySegment.groups.forEach((group) => {
        if (userGroups.some((userGroup) => userGroup.groupId === group.groupId && userGroup.type === group.type)) {
          explicitGroupInclusionFilteredData.push({
            groupId: group.groupId,
            type: group.type,
            id: entityId,
          });
        }
      });
    });

    // pseudocode for entity level inclusion and exclusion
    //
    // If the user or the user's group is on the global exclude list, exclude the user.
    //
    // ELSE If the entity default is "include all" then
    //     If the user is on the exclude list, then exclude the user.
    //     Else if any of the user's groups is on the exclude list then
    //           If the user is on the include list, include the user
    //           Else exclude the user
    //     Else include the user.
    // ELSE If the entity default is "exclude all" then
    //     If the user is on the include list, then include the user.
    //     Else if any of the user's groups are on the include list then
    //           If the user is on the exclude list, exclude the user
    //           Else include the user
    //     Else exclude the user

    const userIncludedEntities: string[] = [];
    const userExcludedEntities: { id: string; reason: string; matchedGroup?: boolean }[] = [];

    entityIds.forEach((entity) => {
      let inclusionFlag = false;
      let exclusionFlag = false;
      let sameGroupExclusionFlag = false;

      if (entity.filterMode === FILTER_MODE.INCLUDE_ALL) {
        if (explicitIndividualExclusionFilteredData.some((x) => x.id === entity.id)) {
          userExcludedEntities.push({ id: entity.id, reason: 'user' });
        } else if (explicitIndividualInclusionFilteredData.some((x) => x.id === entity.id)) {
          userIncludedEntities.push(entity.id);
        } else {
          for (const userGroup of userGroups) {
            const matchingExclusionData = explicitGroupExclusionFilteredData.find(
              (x) => x.groupId === userGroup.groupId && x.type === userGroup.type && x.id === entity.id
            );

            if (matchingExclusionData) {
              inclusionFlag = true;

              if (matchingExclusionData.type === entity.group) {
                sameGroupExclusionFlag = true;
              }
            }
          }
          if (!inclusionFlag) {
            userIncludedEntities.push(entity.id);
          } else {
            const matchedGroup = sameGroupExclusionFlag;
            userExcludedEntities.push({
              id: entity.id,
              reason: 'group',
              matchedGroup, // matchedExcludedGroup === experiment.group
            });
            if (!matchedGroup) {
              indirectExcludedExperiments.push(entity.id);
            }
          }
        }
      } else {
        if (explicitIndividualExclusionFilteredData.some((x) => x.id === entity.id)) {
          userExcludedEntities.push({ id: entity.id, reason: 'filterMode' });
        } else if (explicitIndividualInclusionFilteredData.some((x) => x.id === entity.id)) {
          userIncludedEntities.push(entity.id);
        } else {
          for (const userGroup of userGroups) {
            if (
              explicitGroupExclusionFilteredData.some(
                (x) => x.groupId === userGroup.groupId && x.type === userGroup.type && x.id === entity.id
              )
            ) {
              exclusionFlag = true;
            }
            if (
              explicitGroupInclusionFilteredData.some(
                (x) => x.groupId === userGroup.groupId && x.type === userGroup.type && x.id === entity.id
              )
            ) {
              inclusionFlag = true;
            }
          }
          if (inclusionFlag && !exclusionFlag) {
            userIncludedEntities.push(entity.id);
          } else {
            userExcludedEntities.push({ id: entity.id, reason: 'filterMode' });
          }
        }
      }
    });

    const userWorkingGroupIds = [];
    if (experimentUser.workingGroup) {
      Object.keys(experimentUser.workingGroup).forEach((type) => {
        userWorkingGroupIds.push(experimentUser.workingGroup[type]);
      });
    }
    await this.groupEnrollmentRepository.delete({
      experiment: { id: In(indirectExcludedExperiments) },
      groupId: In(userWorkingGroupIds),
    });

    return [userIncludedEntities, userExcludedEntities];
  }

  private getFactorialCondition(
    conditionAssigned: ExperimentCondition,
    conditionPayloads: ConditionPayloadDTO,
    factors: FactorDTO[]
  ): FactorialConditionResult {
    const levelsForCondition: string[] = [];
    const payloads: string[] = [];
    let factorialCondition;
    conditionAssigned.levelCombinationElements.forEach((element) => {
      levelsForCondition.push(element.level.id);
    });

    const levelsForDecisionPoint = [];
    factors.forEach((factor) => {
      factor.levels.forEach((level) => {
        levelsForDecisionPoint.push({ ...level, factorName: factor.name, order: factor.order });
      });
    });

    const conditionCodeToSet = levelsForDecisionPoint
      .filter((value) => levelsForCondition.includes(value.id))
      .sort((a, b) => a.order - b.order);

    const assignedFactor = {};
    conditionCodeToSet.forEach((x) => {
      assignedFactor[x.factorName] = { level: x.name, payload: { type: x.payload.type, value: x.payload.value } };
    });

    let factorialConditionPayload = null;
    if (conditionPayloads) {
      factorialConditionPayload = conditionPayloads.payload.value;
    }

    if (conditionCodeToSet.length > 1) {
      // for factorial experiment with same decisionPoints
      let conditionCodeName = '';
      conditionCodeToSet.forEach((level) => {
        conditionCodeName += level.factorName + '=' + level.name + '; ';
      });
      conditionCodeName = conditionCodeName.slice(0, -2);

      factorialCondition = {
        ...conditionAssigned,
        conditionCode: conditionCodeName,
      };
      factorialConditionPayload
        ? payloads.push(...[factorialConditionPayload, conditionCodeName])
        : payloads.push(conditionCodeName);
    } else {
      // for factorial experiment with different decisionPoints
      const levelPayload = conditionCodeToSet[0].payload;
      factorialCondition = { ...conditionAssigned, conditionCode: levelPayload || conditionCodeToSet[0].name };

      levelPayload
        ? payloads.push(...[levelPayload, conditionCodeToSet[0].name])
        : payloads.push(conditionCodeToSet[0].name);
    }
    delete factorialCondition.levelCombinationElements;
    delete factorialCondition.conditionPayloads;

    const objectToReturn: FactorialConditionResult = {
      factorialCondition,
      payloads,
      assignedFactor,
      conditionPayload: factorialConditionPayload,
    };
    objectToReturn['factorialCondition'] = factorialCondition;
    objectToReturn['payloads'] = payloads;
    objectToReturn['assignedFactor'] = assignedFactor;
    objectToReturn['conditionPayload'] = factorialConditionPayload;

    return objectToReturn;
  }

  private async getEnrollmentCountPerCondition(
    experiment: Experiment,
    userId: string
  ): Promise<{ conditionId: string; userCount: number }[]> {
    if (experiment.stratificationFactor) {
      const factorValue = await this.userStratificationFactorRepository
        .createQueryBuilder('srsUser')
        .select('usf.stratificationFactorValue')
        .from(UserStratificationFactor, 'usf')
        .where('usf.factorName = :factor', {
          factor: experiment.stratificationFactor.stratificationFactorName,
        })
        .andWhere('usf.userId = :userIdX', { userIdX: userId })
        .getOne();

      const result = await this.userStratificationFactorRepository
        .createQueryBuilder('srsUser')
        .select(['CAST(COUNT(srsUser.user) AS INTEGER) as "userCount", enrollment.conditionId'])
        .innerJoin(IndividualEnrollment, 'enrollment', 'enrollment.userId = srsUser.userId')
        .where('srsUser.stratificationFactorValue = :factorValue', {
          factorValue: factorValue?.stratificationFactorValue,
        })
        .andWhere('srsUser.factorName = :factor', {
          factor: experiment.stratificationFactor.stratificationFactorName,
        })
        .groupBy('enrollment.conditionId')
        .execute();

      return result;
    }
    return [];
  }

  private stratifiedConditionsWeight(enrollmentCounts: number[], conditionsWeight: number[]): number[] {
    const totalConditions: number = conditionsWeight.length;

    // Calculate the total sum of n
    const totalEnrollment: number = enrollmentCounts.reduce((acc, curr) => acc + curr, 0);

    // Calculate actual assignment weights
    let assignmentWeight: number[];

    if (totalEnrollment === 0) {
      assignmentWeight = new Array(totalConditions).fill(0);
    } else {
      assignmentWeight = enrollmentCounts.map((enrollment) => (enrollment * 100) / totalEnrollment);
    }

    // Calculate the new weights wPrime
    let adjustedWeights: number[] = new Array(totalConditions).fill(0);

    for (let i = 0; i < totalConditions; i++) {
      const adjustment: number = conditionsWeight[i] - assignmentWeight[i];

      // Condition based on w and aw relationship
      if (conditionsWeight[i] > assignmentWeight[i]) {
        adjustedWeights[i] = conditionsWeight[i] + adjustment;
        if (adjustedWeights[i] > 100) {
          adjustedWeights[i] = 100;
        }
      } else if (conditionsWeight[i] === assignmentWeight[i]) {
        adjustedWeights[i] = conditionsWeight[i];
      } else {
        adjustedWeights[i] = conditionsWeight[i] + adjustment;
        if (adjustedWeights[i] < 0) {
          adjustedWeights[i] = 0;
        }
      }
    }

    // Renormalize all wPrime
    const totalWPrime: number = adjustedWeights.reduce((acc, curr) => acc + curr, 0);
    adjustedWeights = adjustedWeights.map((weight) => (weight / totalWPrime) * 100);

    return adjustedWeights;
  }
}
