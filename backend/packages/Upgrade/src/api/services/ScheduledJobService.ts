import Container, { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
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
import { getConnection } from 'typeorm';
import { User } from '../models/User';

@Service()
export class ScheduledJobService {
  constructor(
    @OrmRepository() private scheduledJobRepository: ScheduledJobRepository,
    @OrmRepository() private errorRepository: ErrorRepository,
    @OrmRepository() private experimentAuditLogRepository: ExperimentAuditLogRepository,
    private awsService: AWSService,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public async startExperiment(id: string): Promise<any> {
    return await getConnection().transaction(async (transactionalEntityManager) => {
      try {
        const scheduledJobRepository = transactionalEntityManager.getRepository(ScheduledJob);
        const scheduledJob = await scheduledJobRepository.findOne(id, { relations: ['experiment'] });

        const currentDate = new Date();
        const timeDif = Math.abs(currentDate.getTime() - scheduledJob.timeStamp.getTime());
        const fiveHoursInMS = 18000000;

        if (timeDif > fiveHoursInMS) {
          const errorMsg =  'Time Differnce of more than 5 hours is found';
          await scheduledJobRepository.delete({id: scheduledJob.id});
          throw new Error(errorMsg);
        }

        if (scheduledJob && scheduledJob.experiment) {
          const experimentRepository = transactionalEntityManager.getRepository(Experiment);
          const experiment = await experimentRepository.findOne(scheduledJob.experiment.id);
          if (scheduledJob && experiment) {
            const systemUser = await transactionalEntityManager.getRepository(User).findOne({ email: systemUserDoc.email });
            const experimentService = Container.get<ExperimentService>(ExperimentService);
            // update experiment startOn
            await experimentRepository.update({ id: experiment.id }, { startOn: null });
            return experimentService.updateState(
              scheduledJob.experiment.id,
              EXPERIMENT_STATE.ENROLLING,
              systemUser,
              null,
              transactionalEntityManager
            );
          }
        }
        return {};
      } catch (error) {
        this.log.error('Error in start experiment of schedular ', error.message);
        return error;
      }
    });
  }

  public async endExperiment(id: string): Promise<any> {
    return await getConnection().transaction(async (transactionalEntityManager) => {
      try {
        const schedulerJobRepository = transactionalEntityManager.getRepository(ScheduledJob);
        const scheduledJob = await schedulerJobRepository.findOne(id, { relations: ['experiment'] });
        const experimentRepository = transactionalEntityManager.getRepository(Experiment);
        const experiment = await experimentRepository.findOne(scheduledJob.experiment.id);

        const currentDate = new Date();
        const timeDif = Math.abs(currentDate.getTime() - scheduledJob.timeStamp.getTime());
        const fiveHoursInMS = 18000000;

        if (timeDif > fiveHoursInMS) {
          const errorMsg =  'Time Differnce of more than 5 hours is found';
          await schedulerJobRepository.delete({id: scheduledJob.id});
          throw new Error(errorMsg);
        }

        if (scheduledJob && experiment) {
          const systemUser = await transactionalEntityManager.getRepository(User).findOne({ email: systemUserDoc.email });
          const experimentService = Container.get<ExperimentService>(ExperimentService);
          // update experiment startOn
          await experimentRepository.update({ id: experiment.id }, { endOn: null });
          return experimentService.updateState(
            scheduledJob.experiment.id,
            EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            systemUser,
            null,
            transactionalEntityManager
          );
        }
        return {};
      } catch (error) {
        this.log.error('Error in end experiment of schedular ', error.message);
        return error;
      }
    });
  }

  public getAllStartExperiment(): Promise<ScheduledJob[]> {
    this.log.info('get all start experiment scheduled jobs');
    return this.scheduledJobRepository.find({
      where: { type: SCHEDULE_TYPE.START_EXPERIMENT },
      relations: ['experiment'],
    });
  }

  public getAllEndExperiment(): Promise<ScheduledJob[]> {
    this.log.info('get all end experiment scheduled jobs');
    return this.scheduledJobRepository.find({
      where: { type: SCHEDULE_TYPE.END_EXPERIMENT },
      relations: ['experiment'],
    });
  }

  public async updateExperimentSchedules(experiment: Experiment): Promise<void> {
    try {
      const { state, startOn, endOn } = experiment;
      const experimentStartCondition = state === EXPERIMENT_STATE.SCHEDULED;
      const experimentEndCondition =
        !(state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE || state === EXPERIMENT_STATE.CANCELLED) && endOn;
      // query experiment schedules
      const scheduledJobs = await this.scheduledJobRepository.find({ experiment });
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

          const response: any = await this.startExperimentSchedular(
            startOn,
            { id: startDoc.id },
            SCHEDULE_TYPE.START_EXPERIMENT
          );

          // If experiment is already scheduled with old date
          if (startExperimentDoc && startExperimentDoc.executionArn) {
            await this.stopExperimentSchedular(startExperimentDoc.executionArn);
          }

          // add or update document
          await this.scheduledJobRepository.upsertScheduledJob({
            ...startDoc,
            timeStamp: startOn,
            executionArn: response.executionArn,
          });
        }
      } else if (startExperimentDoc) {
        // delete event here
        await this.scheduledJobRepository.delete({ id: startExperimentDoc.id });
        await this.stopExperimentSchedular(startExperimentDoc.executionArn);
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

          const response: any = await this.startExperimentSchedular(
            endOn,
            { id: endDoc.id },
            SCHEDULE_TYPE.END_EXPERIMENT
          );

          // If experiment is already scheduled with old date
          if (endExperimentDoc && endExperimentDoc.executionArn) {
            await this.stopExperimentSchedular(endExperimentDoc.executionArn);
          }
          // add or update document
          await this.scheduledJobRepository.upsertScheduledJob({
            ...endDoc,
            timeStamp: endOn,
            executionArn: response.executionArn,
          });
        }
      } else if (endExperimentDoc) {
        // delete event here
        await this.scheduledJobRepository.delete({ id: endExperimentDoc.id });
        await this.stopExperimentSchedular(endExperimentDoc.executionArn);
      }
    } catch (error) {
      this.log.error('Error in experiment schedular ', error.message);
    }
  }

  public async clearLogs(): Promise<boolean> {
    try {
      // Do not return deleted logs as number of logs can be very large
      const offset = 500; // Number of logs that we do not want to delete
      await Promise.all([this.experimentAuditLogRepository.clearLogs(offset), this.errorRepository.clearLogs(offset)]);
      return true;
    } catch (error) {
      this.log.error('Error in clear Logs schedular ', error.message);
      return false;
    }
  }

  private async startExperimentSchedular(timeStamp: Date, body: any, type: SCHEDULE_TYPE): Promise<any> {
    const url =
      type === SCHEDULE_TYPE.START_EXPERIMENT
        ? env.hostUrl + '/scheduledJobs/start'
        : env.hostUrl + '/scheduledJobs/end';
    const experimentSchedularStateMachine = {
      stateMachineArn: env.schedular.stepFunctionArn,
      input: JSON.stringify({
        timeStamp,
        body,
        url,
      }),
    };

    return this.awsService.stepFunctionStartExecution(experimentSchedularStateMachine);
  }

  private async stopExperimentSchedular(executionArn: string): Promise<any> {
    return this.awsService.stepFunctionStopExecution({ executionArn });
  }
}
