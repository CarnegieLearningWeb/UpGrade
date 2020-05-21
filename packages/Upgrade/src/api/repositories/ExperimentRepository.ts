import { EXPERIMENT_STATE } from 'upgrade_types';
import { Repository, EntityRepository, EntityManager, Brackets } from 'typeorm';
import { Experiment } from '../models/Experiment';
import repositoryError from './utils/repositoryError';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {
  public async findAllExperiments(): Promise<Experiment[]> {
    return this.createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.conditions', 'conditions')
      .innerJoinAndSelect('experiment.partitions', 'partitions')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async findAllName(): Promise<Array<Pick<Experiment, 'id' | 'name'>>> {
    return this.createQueryBuilder('experiment')
      .select(['experiment.id', 'experiment.name'])
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async getValidExperiments(context: string): Promise<Experiment[]> {
    return this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .where(
        new Brackets((qb) => {
          qb.where('(experiment.state = :enrolling OR experiment.state = :enrollmentComplete) AND :context ILIKE ANY (ARRAY[experiment.context])', {
            enrolling: 'enrolling',
            enrollmentComplete: 'enrollmentComplete',
            context,
          });
        })
      )
      .getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'getValidExperiments', {}, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async getValidExperimentsWithPreview(context: string): Promise<Experiment[]> {
    return this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .where(
        new Brackets((qb) => {
          qb.where(
            '(experiment.state = :enrolling OR experiment.state = :enrollmentComplete OR experiment.state = :preview) AND :context ILIKE ANY (ARRAY[experiment.context])',
            {
              enrolling: 'enrolling',
              enrollmentComplete: 'enrollmentComplete',
              preview: 'preview',
              context,
            }
          );
        })
      )
      .getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'getValidExperimentsWithPreview', {}, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async updateState(experimentId: string, state: EXPERIMENT_STATE, scheduleDate: Date): Promise<Experiment> {
    const result = await this.createQueryBuilder('experiment')
      .update()
      .set({ state, startOn: scheduleDate })
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

  public async insertBatchExps(experimentDocs: Array<Partial<Experiment>>, entityManager: EntityManager): Promise<Experiment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Experiment)
      .values(experimentDocs)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'insertExperiment',
          { experimentDocs },
          errorMsg
        );
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
        const errorMsgString = repositoryError('ExperimentRepository', 'deleteExperimentById', { id }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
