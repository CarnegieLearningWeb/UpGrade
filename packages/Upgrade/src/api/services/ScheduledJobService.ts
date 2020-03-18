import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { ScheduledJob, SCHEDULE_TYPE } from '../models/ScheduledJob';
import { Experiment } from '../models/Experiment';
import { EXPERIMENT_STATE } from 'ees_types';
import AWS from 'aws-sdk';
import { env } from '../../env';
import { ExperimentRepository } from '../repositories/ExperimentRepository';

const stepFunction = new AWS.StepFunctions({
  region: env.aws.region,
});

@Service()
export class ScheduledJobService {
  constructor(
    @OrmRepository() private scheduledJobRepository: ScheduledJobRepository,
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public async startExperiment(id: string): Promise<any> {
    const scheduledJob = await this.scheduledJobRepository.findOne(id);
    if (scheduledJob && scheduledJob.experimentId) {
      const experiment = await this.experimentRepository.findOne(scheduledJob.experimentId);
      if (scheduledJob && experiment) {
        // TODO use system user to Update State
        // const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
        // this.experimentAssignmentService.updateState(scheduledJob.experimentId, EXPERIMENT_STATE.ENROLLING);
      }
    }
    return {};
  }

  public async endExperiment(id: string): Promise<any> {
    const scheduledJob = await this.scheduledJobRepository.findOne(id);
    const experiment = await this.experimentRepository.findOne(scheduledJob.experimentId);
    if (scheduledJob && experiment) {
      // TODO use system user to Update State
      // const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
      // this.experimentAssignmentService.updateState(scheduledJob.experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE);
    }
    return {};
  }

  public getAllStartExperiment(): Promise<ScheduledJob[]> {
    this.log.info('get all start experiment scheduled jobs');
    return this.scheduledJobRepository.find({ type: SCHEDULE_TYPE.START_EXPERIMENT });
  }

  public getAllEndExperiment(): Promise<ScheduledJob[]> {
    this.log.info('get all end experiment scheduled jobs');
    return this.scheduledJobRepository.find({ type: SCHEDULE_TYPE.END_EXPERIMENT });
  }

  public async updateExperimentSchedules(experiment: Experiment): Promise<void> {
    try {
      const { id, state, startOn, endOn } = experiment;
      const experimentStartCondition = state === EXPERIMENT_STATE.SCHEDULED;
      const experimentEndCondition =
        !(state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE || state === EXPERIMENT_STATE.CANCELLED) && endOn;
      // query experiment schedules
      const scheduledJobs = await this.scheduledJobRepository.find({ experimentId: id });
      const startExperimentDoc = scheduledJobs.find(({ type }) => {
        return type === SCHEDULE_TYPE.START_EXPERIMENT;
      });

      // create start schedule if STATE is in scheduled and date changes
      if (experimentStartCondition) {
        if (!startExperimentDoc || (startOn && startExperimentDoc.timeStamp !== startOn)) {
          const startDoc = startExperimentDoc || {
            id: `${experiment.id}_${SCHEDULE_TYPE.START_EXPERIMENT}`,
            experimentId: experiment.id,
            type: SCHEDULE_TYPE.START_EXPERIMENT,
            timeStamp: startOn,
          };

          const response: any = await this.startExperimentSchedular(startOn, startDoc);

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
            experimentId: experiment.id,
            type: SCHEDULE_TYPE.END_EXPERIMENT,
            timeStamp: endOn,
          };

          const response: any = await this.startExperimentSchedular(endOn, endDoc);

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
      console.log('Error in experiment schedular ', error.message);
    }
  }

  // TODO:  Add url in input params
  private async startExperimentSchedular(timeStamp: Date, body: any): Promise<any> {
    const experimentSchedularStateMachine = {
      stateMachineArn: env.schedular.stepFunctionArn,
      input: JSON.stringify({
        timeStamp,
        body,
      }),
    };
    return await stepFunction.startExecution(experimentSchedularStateMachine).promise();
  }

  private async stopExperimentSchedular(executionArn: string): Promise<any> {
    return await stepFunction.stopExecution({ executionArn }).promise();
  }
}
