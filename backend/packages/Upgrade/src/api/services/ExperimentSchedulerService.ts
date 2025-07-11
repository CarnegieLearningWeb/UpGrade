import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { ScheduledJob, SCHEDULE_TYPE } from '../models/ScheduledJob';
import { Experiment } from '../models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { env } from '../../env';
import { AWSService } from './AWSService';
import { EntityManager } from 'typeorm';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class ExperimentSchedulerService {
  constructor(
    @InjectRepository() private scheduledJobRepository: ScheduledJobRepository,
    private awsService: AWSService
  ) {}

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
      const scheduledJobs = await scheduledJobRepo.findBy({ experiment: { id: experiment.id } });
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
