import { EXPERIMENT_STATE } from 'ees_types';
import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { Experiment } from '../models/Experiment';
import repositoryError from './utils/repositoryError';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {
  public async getValidExperiments(): Promise<Experiment[]> {
    return this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .where('experiment.state = :enrolling OR experiment.state = :enrollmentComplete OR experiment.state = :preview', {
        enrolling: 'enrolling',
        enrollmentComplete: 'enrollmentComplete',
        preview: 'preview',
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'getEnrollingAndEnrollmentComplete',
          {},
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async updateState(experimentId: string, state: EXPERIMENT_STATE): Promise<Experiment> {
    const result = await this.createQueryBuilder('experiment')
      .update()
      .set({ state })
      .where({ id: experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'updateState',
          { experimentId, state },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async updateExperiment(experimentDoc: Partial<Experiment>, entityManager: EntityManager): Promise<Experiment> {
    const result = await entityManager
      .createQueryBuilder()
      .update(Experiment)
      .set(experimentDoc)
      .where({ id: experimentDoc.id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'updateExperiment', { experimentDoc }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async insertExperiment(experimentDoc: Experiment, entityManager: EntityManager): Promise<Experiment> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Experiment)
      .values(experimentDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'insertExperiment', { experimentDoc }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteById(id: string, entityManager: EntityManager): Promise<Experiment> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(Experiment)
      .where('id = :id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'insertExperiment', { id }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
