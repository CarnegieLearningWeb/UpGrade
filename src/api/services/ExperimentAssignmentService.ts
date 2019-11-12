import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentSegmentRepository } from '../repositories/ExperimentSegmentRepository';
import { EXPERIMENT_STATE, CONSISTENCY_RULE } from '../models/Experiment';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Service } from 'typedi';
import { MonitoredExperimentPointRepository } from '../repositories/MonitoredExperimentPointRepository';

@Service()
export class ExperimentAssignmentService {
  constructor(
    @OrmRepository() private experimentSegmentRepository: ExperimentSegmentRepository,
    @OrmRepository() private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository() private monitoredExperimentPointRepository: MonitoredExperimentPointRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}
  public async markExperimentPoint(
    experimentId: string,
    experimentPoint: string,
    userId: string,
    userEnvironment: object
  ): Promise<any> {
    this.log.info(
      `Mark experiment point => Experiment: ${experimentId}, Experiment Point: ${experimentPoint} for User: ${userId}`
    );
    // TODO when experiment is not defined
    // query root experiment id
    const experiment = await this.experimentSegmentRepository.findOne({
      where: {
        id: experimentId,
        point: experimentPoint,
      },
      relations: ['experiment'],
    });

    const { state, consistencyRule, id, group } = experiment.experiment;

    if (
      !(
        state === EXPERIMENT_STATE.CANCELLED ||
        state === EXPERIMENT_STATE.ENROLLING ||
        state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE
      )
    ) {
      if (consistencyRule === CONSISTENCY_RULE.GROUP || consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
        // add entry in group exclusion
        if (consistencyRule === CONSISTENCY_RULE.GROUP) {
          this.groupExclusionRepository.saveRawJson({ experimentId: id, groupId: userEnvironment[group] });
        }

        // add entry in individual exclusion
        if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL || consistencyRule === CONSISTENCY_RULE.GROUP) {
          this.individualExclusionRepository.saveRawJson({ experimentId: id, userId });
        }
      }
    }
    // TODO add in the experiments logs
    // adding in monitored experiment point table
    return this.monitoredExperimentPointRepository.saveRawJson({ experimentId, experimentPoint, userId });
  }

  public check(): Promise<any> {
    return this.monitoredExperimentPointRepository.find();
  }
}
