import { Service } from 'typedi';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';
import { ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { ScheduledJob, SCHEDULE_TYPE } from '../models/ScheduledJob';
import { Experiment } from '../models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { systemUserDoc } from '../../init/seed/systemUser';
import { ExperimentService } from './ExperimentService';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class ScheduledJobService {
  constructor(
    @InjectRepository() private scheduledJobRepository: ScheduledJobRepository,
    @InjectRepository() private errorRepository: ErrorRepository,
    @InjectRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectDataSource() private dataSource: DataSource,
    private experimentService: ExperimentService
  ) {}

  public async startExperiment(id: string, logger: UpgradeLogger): Promise<any> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        const scheduledJobRepository = transactionalEntityManager.getRepository(ScheduledJob);
        const scheduledJob = await scheduledJobRepository.findOne({ where: { id }, relations: ['experiment'] });

        const currentDate = new Date();
        const timeDiff = Math.abs(currentDate.getTime() - scheduledJob.timeStamp.getTime());
        const fiveHoursInMS = 18000000;

        if (timeDiff > fiveHoursInMS) {
          const errorMsg = 'Time Difference of more than 5 hours is found';
          await scheduledJobRepository.delete({ id: scheduledJob.id });
          logger.error({ message: errorMsg });
          throw new Error(errorMsg);
        }

        if (scheduledJob && scheduledJob.experiment) {
          const experimentRepository = transactionalEntityManager.getRepository(Experiment);
          const experiment = await experimentRepository.findOneBy({ id: scheduledJob.experiment.id });
          if (experiment) {
            const systemUser = await transactionalEntityManager
              .getRepository(User)
              .findOneBy({ email: systemUserDoc.email });
            // update experiment startOn
            await experimentRepository.update({ id: experiment.id }, { startOn: null });
            return await this.experimentService.updateState(
              scheduledJob.experiment.id,
              EXPERIMENT_STATE.ENROLLING,
              systemUser,
              logger,
              null,
              transactionalEntityManager
            );
          }
        }
        return {};
      } catch (err) {
        const error = err as Error;
        error.message = `Error in start experiment of scheduler: ${error.message}`;
        logger.error(error);
        return error;
      }
    });
  }

  public async endExperiment(id: string, logger: UpgradeLogger): Promise<any> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        const scheduledJobRepository = transactionalEntityManager.getRepository(ScheduledJob);
        const scheduledJob = await scheduledJobRepository.findOne({ where: { id }, relations: ['experiment'] });
        const experimentRepository = transactionalEntityManager.getRepository(Experiment);
        const experiment = await experimentRepository.findOneBy({ id: scheduledJob.experiment.id });

        const currentDate = new Date();
        const timeDiff = Math.abs(currentDate.getTime() - scheduledJob.timeStamp.getTime());
        const fiveHoursInMS = 18000000;

        if (timeDiff > fiveHoursInMS) {
          const errorMsg = 'Time Difference of more than 5 hours is found';
          await scheduledJobRepository.delete({ id: scheduledJob.id });
          logger.error({ message: errorMsg });
          throw new Error(errorMsg);
        }

        if (scheduledJob && experiment) {
          const systemUser = await transactionalEntityManager
            .getRepository(User)
            .findOneBy({ email: systemUserDoc.email });
          // update experiment startOn
          await experimentRepository.update({ id: experiment.id }, { endOn: null });
          return await this.experimentService.updateState(
            scheduledJob.experiment.id,
            EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            systemUser,
            logger,
            null,
            transactionalEntityManager
          );
        }
        return {};
      } catch (err) {
        const error = err as Error;
        error.message = `Error in end experiment of scheduler: ${error.message}`;
        logger.error(error);
        return error;
      }
    });
  }

  public getAllStartExperiment(logger: UpgradeLogger): Promise<ScheduledJob[]> {
    logger.info({ message: 'get all start experiment scheduled jobs' });
    return this.scheduledJobRepository.find({
      where: { type: SCHEDULE_TYPE.START_EXPERIMENT },
      relations: ['experiment'],
    });
  }

  public getAllEndExperiment(logger: UpgradeLogger): Promise<ScheduledJob[]> {
    logger.info({ message: 'get all end experiment scheduled jobs' });
    return this.scheduledJobRepository.find({
      where: { type: SCHEDULE_TYPE.END_EXPERIMENT },
      relations: ['experiment'],
    });
  }

  public async clearLogs(logger: UpgradeLogger): Promise<boolean> {
    try {
      // Do not return deleted logs as number of logs can be very large
      const offset = 500; // Number of logs that we do not want to delete
      await Promise.all([this.experimentAuditLogRepository.clearLogs(offset), this.errorRepository.clearLogs(offset)]);
      return true;
    } catch (err) {
      const error = err as Error;
      error.message = `Error in clear Logs scheduler: ${error.message}`;
      logger.error(error);
      return false;
    }
  }
}
