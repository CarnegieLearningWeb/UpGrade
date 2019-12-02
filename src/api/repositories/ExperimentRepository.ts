import { Experiment, EXPERIMENT_STATE } from '../models/Experiment';
import { Repository, EntityRepository, UpdateResult, InsertResult } from 'typeorm';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {
  public getEnrollingAndEnrollmentComplete(): Promise<Experiment[]> {
    return this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.segments', 'segments')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .where('experiment.state = :enrolling OR experiment.state = :enrollmentComplete', {
        enrolling: 'enrolling',
        enrollmentComplete: 'enrollmentComplete',
      })
      .getMany();
  }

  public updateState(experimentId: string, state: EXPERIMENT_STATE): Promise<UpdateResult> {
    return this.createQueryBuilder('experiment')
      .update()
      .set({ state })
      .where({ id: experimentId })
      .returning('*')
      .execute();
  }

  public updateExperiment(experimentId: string, experimentDoc: Partial<Experiment>): Promise<UpdateResult> {
    return this.createQueryBuilder('experiment')
      .update()
      .set(experimentDoc)
      .where({ id: experimentId })
      .returning('*')
      .execute();
  }

  public insertExperiment(experimentDoc: Experiment): Promise<InsertResult> {
    return this.createQueryBuilder()
      .insert()
      .values(experimentDoc)
      .returning('*')
      .execute();
  }
}
