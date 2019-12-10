import { EXPERIMENT_STATE } from 'ees_types';
import { Repository, EntityRepository } from 'typeorm';
import { Experiment } from '../models/Experiment';

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

  public async updateState(experimentId: string, state: EXPERIMENT_STATE): Promise<Experiment> {
    const result = await this.createQueryBuilder('experiment')
      .update()
      .set({ state })
      .where({ id: experimentId })
      .returning('*')
      .execute();

    return result.raw;
  }

  public async updateExperiment(experimentId: string, experimentDoc: Partial<Experiment>): Promise<Experiment> {
    const result = await this.createQueryBuilder('experiment')
      .update()
      .set(experimentDoc)
      .where({ id: experimentId })
      .returning('*')
      .execute();

    return result.raw;
  }

  public async insertExperiment(experimentDoc: Experiment): Promise<Experiment> {
    const result = await this.createQueryBuilder()
      .insert()
      .values(experimentDoc)
      .returning('*')
      .execute();

    return result.raw;
  }
}
