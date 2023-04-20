import { EXPERIMENT_STATE, SERVER_ERROR } from 'upgrade_types';
import { Repository, EntityRepository, EntityManager, Brackets } from 'typeorm';
import { Experiment } from '../models/Experiment';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { createGlobalExcludeSegment } from '../../../src/init/seed/globalExcludeSegment';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {
  public async findAllExperiments(): Promise<Experiment[]> {
    const experiment = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels')
      .leftJoinAndSelect('queries.metric', 'metric')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload')
      .leftJoinAndSelect('levelCombinationElements.level', 'level');

    const experimentSegment = this.createQueryBuilder('experiment')
      .select('experiment.id')
      .leftJoinAndSelect('experiment.experimentSegmentInclusion', 'experimentSegmentInclusion')
      .leftJoinAndSelect('experimentSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('experiment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .leftJoinAndSelect('experimentSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion');

    const [experimentData, experimentSegmentData] = await Promise.all([
      experiment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      }),
      experimentSegment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      }),
    ]);

    const mergedData = experimentData.map((data) => {
      const { id } = data;
      const segmentData = experimentSegmentData.find((segmentData) => {
        return segmentData.id === id;
      });
      return segmentData ? { ...data, ...segmentData } : data;
    });

    return mergedData;
  }

  public async findAllName(): Promise<Array<Pick<Experiment, 'id' | 'name'>>> {
    return this.createQueryBuilder('experiment')
      .select(['experiment.id', 'experiment.name'])
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      });
  }

  public async getValidExperiments(context: string): Promise<Experiment[]> {
    const experiment = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels')
      .leftJoinAndSelect('queries.metric', 'metric')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
      .where(
        new Brackets((qb) => {
          qb.where(
            '(experiment.state = :enrolling OR experiment.state = :enrollmentComplete) AND :context ILIKE ANY (ARRAY[experiment.context])',
            {
              enrolling: 'enrolling',
              enrollmentComplete: 'enrollmentComplete',
              context,
            }
          );
        })
      );

    const experimentSegment = this.createQueryBuilder('experiment')
      // making small queries
      .select('experiment.id')
      .leftJoinAndSelect('experiment.experimentSegmentInclusion', 'experimentSegmentInclusion')
      .leftJoinAndSelect('experimentSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('experiment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .leftJoinAndSelect('experimentSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .where(
        new Brackets((qb) => {
          qb.where(
            '(experiment.state = :enrolling OR experiment.state = :enrollmentComplete) AND :context ILIKE ANY (ARRAY[experiment.context])',
            {
              enrolling: 'enrolling',
              enrollmentComplete: 'enrollmentComplete',
              context,
            }
          );
        })
      );

    const [experimentData, experimentSegmentData] = await Promise.all([
      experiment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      }),
      experimentSegment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      }),
    ]);

    const mergedData = experimentData.map((data) => {
      const { id } = data;
      const segmentData = experimentSegmentData.find((segmentData) => {
        return segmentData.id === id;
      });
      return segmentData ? { ...data, ...segmentData } : data;
    });

    return mergedData;
  }

  public async getValidExperimentsWithPreview(context: string): Promise<Experiment[]> {
    const experiment = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels')
      .leftJoinAndSelect('queries.metric', 'metric')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
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
      );

    const experimentSegment = this.createQueryBuilder('experiment')
      .select('experiment.id')
      .leftJoinAndSelect('experiment.experimentSegmentInclusion', 'experimentSegmentInclusion')
      .leftJoinAndSelect('experimentSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('experiment.experimentSegmentExclusion', 'experimentSegmentExclusion')
      .leftJoinAndSelect('experimentSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
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
      );

    const [experimentData, experimentSegmentData] = await Promise.all([
      experiment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      }),
      experimentSegment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentRepository', 'find', {}, errorMsg);
        throw errorMsgString;
      }),
    ]);

    const mergedData = experimentData.map((data) => {
      const { id } = data;
      const segmentData = experimentSegmentData.find((segmentData) => {
        return segmentData.id === id;
      });
      return segmentData ? { ...data, ...segmentData } : data;
    });

    return mergedData;
  }

  public async updateState(
    experimentId: string,
    state: EXPERIMENT_STATE,
    scheduleDate: Date,
    entityManager?: EntityManager
  ): Promise<Experiment> {
    const that = entityManager ? entityManager : this;
    const result = await that
      .createQueryBuilder()
      .update(Experiment)
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
        throw errorMsgString;
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
        throw errorMsgString;
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
        throw errorMsgString;
      });

    return result.raw;
  }

  public async insertBatchExps(
    experimentDocs: Array<Partial<Experiment>>,
    entityManager: EntityManager
  ): Promise<Experiment[]> {
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
        throw errorMsgString;
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
        throw errorMsgString;
      });

    return result.raw;
  }

  public async clearDB(entityManager: EntityManager, logger: UpgradeLogger): Promise<void> {
    try {
      const entities = entityManager.connection.entityMetadatas;
      for (const entity of entities) {
        if (!['user', 'metric', 'setting', 'migrations'].includes(entity.tableName)) {
          const repository = await entityManager.connection.getRepository(entity.name);
          await repository.query(`TRUNCATE ${entity.tableName} CASCADE;`);
        }
      }
      // Create global exclude segment
      await createGlobalExcludeSegment(logger);
      return;
    } catch (err) {
      const error = err;
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      logger.error(error);
      throw error;
    }
  }
}
