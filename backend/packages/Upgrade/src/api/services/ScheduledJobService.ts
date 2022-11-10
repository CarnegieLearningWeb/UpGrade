import Container, { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { ScheduledJob, SCHEDULE_TYPE } from '../models/ScheduledJob';
import { Experiment } from '../models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { env } from '../../env';
import { AWSService } from './AWSService';
import { systemUserDoc } from '../../init/seed/systemUser';
import { ExperimentService } from './ExperimentService';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { EntityManager } from 'typeorm';
import { getConnection } from 'typeorm';
import { User } from '../models/User';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class ScheduledJobService {
  constructor(
    @OrmRepository() private scheduledJobRepository: ScheduledJobRepository,
    @OrmRepository() private errorRepository: ErrorRepository,
    @OrmRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    private awsService: AWSService
  ) {}

  public async startExperiment(id: string, logger: UpgradeLogger): Promise<any> {
    return await getConnection().transaction(async (transactionalEntityManager) => {
      try {
        const scheduledJobRepository = transactionalEntityManager.getRepository(ScheduledJob);
        const scheduledJob = await scheduledJobRepository.findOne(id, { relations: ['experiment'] });

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
          const experiment = await experimentRepository.findOne(scheduledJob.experiment.id);
          if (scheduledJob && experiment) {
            const systemUser = await transactionalEntityManager
              .getRepository(User)
              .findOne({ email: systemUserDoc.email });
            const experimentService = Container.get<ExperimentService>(ExperimentService);
            // update experiment startOn
            await experimentRepository.update({ id: experiment.id }, { startOn: null });
            return await experimentService.updateState(
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
    return await getConnection().transaction(async (transactionalEntityManager) => {
      try {
        const scheduledJobRepository = transactionalEntityManager.getRepository(ScheduledJob);
        const scheduledJob = await scheduledJobRepository.findOne(id, { relations: ['experiment'] });
        const experimentRepository = transactionalEntityManager.getRepository(Experiment);
        const experiment = await experimentRepository.findOne(scheduledJob.experiment.id);

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
            .findOne({ email: systemUserDoc.email });
          const experimentService = Container.get<ExperimentService>(ExperimentService);
          // update experiment startOn
          await experimentRepository.update({ id: experiment.id }, { endOn: null });
          return await experimentService.updateState(
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

  public async updateExperimentSchedules(
    experiment: Experiment,
    logger: UpgradeLogger,
    entityManager?: EntityManager
  ): Promise<void> {
    try {
      const scheduledJobRepo = entityManager ? entityManager.getRepository(ScheduledJob) : this.scheduledJobRepository;

      const { state, startOn, endOn } = experiment;
      const experimentStartCondition = state === EXPERIMENT_STATE.SCHEDULED;
      const experimentEndCondition =
        !(state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE || state === EXPERIMENT_STATE.CANCELLED) && endOn;
      // query experiment schedules
      const scheduledJobs = await scheduledJobRepo.find({ experiment });
      const startExperimentDoc = scheduledJobs.find(({ type }) => {
        return type === SCHEDULE_TYPE.START_EXPERIMENT;
      });

      // create start schedule if STATE is in scheduled and date changes
      if (experimentStartCondition) {
        if (!startExperimentDoc || (startOn && startExperimentDoc.timeStamp !== startOn)) {
          const startDoc = startExperimentDoc || {
            id: `${experiment.id}_${SCHEDULE_TYPE.START_EXPERIMENT}`,
            experiment,
            type: SCHEDULE_TYPE.START_EXPERIMENT,
            timeStamp: startOn,
          };

          const response: any = await this.startExperimentScheduler(
            startOn,
            { id: startDoc.id },
            SCHEDULE_TYPE.START_EXPERIMENT
          );

          // If experiment is already scheduled with old date
          if (startExperimentDoc && startExperimentDoc.executionArn) {
            await this.stopExperimentScheduler(startExperimentDoc.executionArn);
          }

          // add or update document
          await this.scheduledJobRepository.upsertScheduledJob(
            {
              ...startDoc,
              timeStamp: startOn,
              executionArn: response.executionArn,
            },
            entityManager
          );
        }
      } else if (startExperimentDoc) {
        // delete event here
        await Promise.all([
          scheduledJobRepo.delete({ id: startExperimentDoc.id }),
          this.stopExperimentScheduler(startExperimentDoc.executionArn),
        ]);
      }

      const endExperimentDoc = scheduledJobs.find(({ type }) => {
        return type === SCHEDULE_TYPE.END_EXPERIMENT;
      });

      // create end schedule of STATE is not enrollmentComplete and date changes
      if (experimentEndCondition) {
        if (!endExperimentDoc || (endOn && endExperimentDoc.timeStamp !== endOn)) {
          const endDoc = endExperimentDoc || {
            id: `${experiment.id}_${SCHEDULE_TYPE.END_EXPERIMENT}`,
            experiment,
            type: SCHEDULE_TYPE.END_EXPERIMENT,
            timeStamp: endOn,
          };

          const response: any = await this.startExperimentScheduler(
            endOn,
            { id: endDoc.id },
            SCHEDULE_TYPE.END_EXPERIMENT
          );

          // If experiment is already scheduled with old date
          if (endExperimentDoc && endExperimentDoc.executionArn) {
            await this.stopExperimentScheduler(endExperimentDoc.executionArn);
          }
          // add or update document
          await this.scheduledJobRepository.upsertScheduledJob(
            {
              ...endDoc,
              timeStamp: endOn,
              executionArn: response.executionArn,
            },
            entityManager
          );
        }
      } else if (endExperimentDoc) {
        // delete event here
        await Promise.all([
          scheduledJobRepo.delete({ id: endExperimentDoc.id }),
          this.stopExperimentScheduler(endExperimentDoc.executionArn),
        ]);
      }
    } catch (err) {
      const error = err as Error;
      error.message = `Error in experiment scheduler ${error.message}`;
      logger.error(error);
    }
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

  private async startExperimentScheduler(timeStamp: Date, body: any, type: SCHEDULE_TYPE): Promise<any> {
    const url =
      type === SCHEDULE_TYPE.START_EXPERIMENT
        ? env.hostUrl + '/scheduledJobs/start'
        : env.hostUrl + '/scheduledJobs/end';
    const experimentSchedulerStateMachine = {
      stateMachineArn: env.scheduler.stepFunctionArn,
      input: JSON.stringify({
        timeStamp,
        body,
        url,
      }),
    };
    return this.awsService.stepFunctionStartExecution(experimentSchedulerStateMachine);
  }

  private async stopExperimentScheduler(executionArn: string): Promise<any> {
    return this.awsService.stepFunctionStopExecution({ executionArn });
  }
}
