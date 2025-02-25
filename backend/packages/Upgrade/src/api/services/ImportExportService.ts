import { Service } from 'typedi';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { ExperimentService } from './ExperimentService';
import { ExperimentDTO, ExperimentFile } from '../DTO/ExperimentDTO';
import { env } from '../../env';
import { MoocletExperimentService } from './MoocletExperimentService';
import { UserDTO } from '../DTO/UserDTO';
import { LOG_TYPE, SUPPORTED_MOOCLET_ALGORITHMS } from 'upgrade_types';
import { In } from 'typeorm';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';

@Service()
export class ImportExportService {
  constructor(
    @InjectRepository() protected experimentRepository: ExperimentRepository,
    @InjectRepository() protected experimentAuditLogRepository: ExperimentAuditLogRepository,
    protected experimentService: ExperimentService,
    protected moocletExperimentService: MoocletExperimentService
  ) {}

  public async importExperiments(experiments: ExperimentFile[], user: UserDTO, logger: UpgradeLogger) {
    logger.info({ message: 'importing experiments' });
    const { experiments: experimentList, validatedExperiments } = await this.experimentService.verifyExperiments(
      experiments,
      logger
    );

    await this.addBulkExperiments(experimentList, user, logger);
    return validatedExperiments;
  }

  public async addBulkExperiments(
    experiments: ExperimentDTO[],
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<ExperimentDTO[]> {
    const createdExperiments: ExperimentDTO[] = [];

    await Promise.all(
      experiments.map(async (experiment) => {
        try {
          if (this.moocletExperimentService.isMoocletExperiment(experiment.assignmentAlgorithm)) {
            if (!env.mooclets.enabled) {
              throw new Error('Attempting to import a moclet experiment, but mooclets are not enabled');
            }
            await this.moocletExperimentService.syncCreate({
              experimentDTO: experiment,
              currentUser,
              logger,
            });
          } else {
            const result = await this.experimentService.create(experiment, currentUser, logger);
            createdExperiments.push(result);
          }
        } catch (error) {
          logger.error({
            message: 'Failed to create experiment during import',
            error: error,
            experiment: experiment,
            user: currentUser,
          });
          throw error;
        }
      })
    );
    return createdExperiments;
  }

  public async exportExperiment(
    user: UserDTO,
    logger: UpgradeLogger,
    experimentIds?: string[]
  ): Promise<ExperimentDTO[]> {
    logger.info({ message: `Inside export Experiment JSON ${experimentIds}` });
    const experimentDetails = await this.experimentRepository.find({
      where: experimentIds ? { id: In(experimentIds) } : undefined,
      relations: [
        'partitions',
        'conditions',
        'stateTimeLogs',
        'queries',
        'queries.metric',
        'experimentSegmentInclusion',
        'experimentSegmentInclusion.segment',
        'experimentSegmentInclusion.segment.individualForSegment',
        'experimentSegmentInclusion.segment.groupForSegment',
        'experimentSegmentInclusion.segment.subSegments',
        'experimentSegmentExclusion',
        'experimentSegmentExclusion.segment',
        'experimentSegmentExclusion.segment.individualForSegment',
        'experimentSegmentExclusion.segment.groupForSegment',
        'experimentSegmentExclusion.segment.subSegments',
        'partitions.conditionPayloads',
        'partitions.conditionPayloads.parentCondition',
        'factors',
        'factors.levels',
        'conditions.conditionPayloads',
        'conditions.levelCombinationElements',
        'conditions.levelCombinationElements.level',
        'stratificationFactor',
      ],
    });

    const formattedExperiments = await Promise.all(
      experimentDetails.map(async (experiment) => {
        experiment.backendVersion = env.app.version;

        let experimentRecord = this.experimentService.reducedConditionPayload(
          this.experimentService.formatingPayload(this.experimentService.formatingConditionPayload(experiment))
        );

        // If it's a mooclet experiment, attach reward key and policy parameters
        if (SUPPORTED_MOOCLET_ALGORITHMS.includes(experiment.assignmentAlgorithm)) {
          try {
            experimentRecord = await this.moocletExperimentService.attachRewardKeyAndPolicyParamsToExperimentDTO(
              experimentRecord,
              logger
            );
          } catch (error) {
            logger.error({
              message: 'Failed to get mooclet data for experiment',
              error: error,
              experiment: experiment,
              user: user,
            });
            throw error;
          }
          // remove currentPosteriors from moocletPolicyParameters for export
          const { currentPosteriors: _, ...filteredPolictParameters } = experimentRecord.moocletPolicyParameters;

          experimentRecord.moocletPolicyParameters = filteredPolictParameters;
        }

        this.experimentAuditLogRepository.saveRawJson(
          LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
          { experimentName: experiment.name },
          user
        );
        return experimentRecord;
      })
    );
    return formattedExperiments;
  }

  public createMultipleExperiments(
    experiments: ExperimentDTO[],
    user: UserDTO,
    logger: UpgradeLogger
  ): Promise<ExperimentDTO[]> {
    logger.info({ message: `Generating test experiments`, details: experiments });
    return this.addBulkExperiments(experiments, user, logger);
  }
}
