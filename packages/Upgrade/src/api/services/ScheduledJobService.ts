import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { ScheduledJob, SCHEDULE_TYPE } from '../models/ScheduledJob';
import { Experiment } from '../models/Experiment';
import { EXPERIMENT_STATE } from 'ees_types';

@Service()
export class ScheduledJobService {
  constructor(
    @OrmRepository() private scheduledJobRepository: ScheduledJobRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}

  public getAllStartExperiment(): Promise<ScheduledJob[]> {
    this.log.info('get all start experiment scheduled jobs');
    return this.scheduledJobRepository.find({ type: SCHEDULE_TYPE.START_EXPERIMENT });
  }

  public getAllEndExperiment(): Promise<ScheduledJob[]> {
    this.log.info('get all end experiment scheduled jobs');
    return this.scheduledJobRepository.find({ type: SCHEDULE_TYPE.END_EXPERIMENT });
  }

  public async updateExperimentSchedules(experiment: Experiment): Promise<void> {
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
        // add or update document
        await this.scheduledJobRepository.upsertScheduledJob({ ...startDoc, timeStamp: startOn });
        // TODO create aws event here
      }
    } else if (startExperimentDoc) {
      // delete event here
      await this.scheduledJobRepository.delete({ id: startExperimentDoc.id });
      // TODO delete scheduled event from aws
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
        // add or update document
        await this.scheduledJobRepository.upsertScheduledJob({ ...endDoc, timeStamp: endOn });
        // TODO create aws event here
      }
    } else if (endExperimentDoc) {
      // delete event here
      await this.scheduledJobRepository.delete({ id: endExperimentDoc.id });
      // TODO delete scheduled event from aws
    }
  }
}
