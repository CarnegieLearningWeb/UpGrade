import { EXPERIMENT_STATE } from 'ees_types';
import { Repository, EntityRepository, EntityManager } from 'typeorm';
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

  public async updateExperiment(experimentDoc: Partial<Experiment>, entityManager: EntityManager): Promise<Experiment> {
    const result = await entityManager
      .createQueryBuilder()
      .update(Experiment)
      .set(experimentDoc)
      .where({ id: experimentDoc.id })
      .returning('*')
      .execute();

    return result.raw;
  }

  public async insertExperiment(experimentDoc: Experiment, entityManager: EntityManager): Promise<Experiment> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Experiment)
      .values(experimentDoc)
      .returning('*')
      .execute();

    return result.raw;
  }
}
