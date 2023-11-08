import { EXPERIMENT_STATE, SERVER_ERROR } from 'upgrade_types';
import { Repository, EntityRepository, EntityManager, Brackets } from 'typeorm';
import { Experiment } from '../models/Experiment';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { createGlobalExcludeSegment } from '../../../src/init/seed/globalExcludeSegment';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {
  public async findAllExperiments(): Promise<Experiment[]> {
    const experimentConditionLevelPayloadQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload');

    const experimentFactorPartitionLevelPayloadQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels');

    const experimentMetricQuery = this.createQueryBuilder('experiment')
    .leftJoinAndSelect('experiment.queries', 'queries')
    .leftJoinAndSelect('queries.metric', 'metric')
    .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs');

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

    const [experimentConditionLevelPayloadData, experimentFactorPartitionLevelPayloadData, experimentMetricData, experimentSegmentData] = await Promise.all([
      experimentConditionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findAllExperiments-experimentConditionLevelPayloadData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
      experimentFactorPartitionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findAllExperiments-experimentFactorPartitionLevelPayloadData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
      experimentMetricQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findAllExperiments-experimentMetricData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
      experimentSegment.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findAllExperiments-experimentSegmentData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
    ]);

    const experimentData = experimentConditionLevelPayloadData.map((data) => {
      const data2 = experimentFactorPartitionLevelPayloadData.find((i) => i.id === data.id);
      const data3 = experimentMetricData.find((i) => i.id === data.id);
      return { ...data, ...data2, ...data3 };
    });

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
        const errorMsgString = repositoryError('ExperimentRepository', 'findAllName', {}, errorMsg);
        throw errorMsgString;
      });
  }

  public async getValidExperiments(context: string): Promise<Experiment[]> {
    const whereExperimentsClause =
      '(experiment.state = :enrolling OR experiment.state = :enrollmentComplete) AND NOT (experiment.state = :enrollmentComplete AND experiment.postExperimentRule = :assign AND experiment.revertTo IS NULL) AND :context ILIKE ANY (ARRAY[experiment.context])';
    const whereClauseParams = {
      enrolling: 'enrolling',
      enrollmentComplete: 'enrollmentComplete',
      assign: 'assign',
      context,
    };
    const experimentConditionLevelPayloadQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload')
      .where(
        new Brackets((qb) => {
          qb.where(whereExperimentsClause, whereClauseParams);
        })
      );

    const experimentFactorPartitionLevelPayloadQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels')
      .where(
        new Brackets((qb) => {
          qb.where(whereExperimentsClause, whereClauseParams);
        })
      );

    const experimentSegmentQuery = this.createQueryBuilder('experiment')
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
          qb.where(whereExperimentsClause, whereClauseParams);
        })
      );

    const [experimentConditionLevelPayloadData, experimentFactorPartitionLevelPayloadData, experimentSegmentData] =
      await Promise.all([
        experimentConditionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentConditionLevelPayloadQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
        experimentFactorPartitionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentFactorPartitionLevelPayloadQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
        experimentSegmentQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentSegmentQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
      ]);

    const experimentData = experimentConditionLevelPayloadData.map((data) => {
      const data2 = experimentFactorPartitionLevelPayloadData.find((i) => i.id === data.id);
      return { ...data, ...data2 };
    });

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
    const whereExperimentsClause =
      '(experiment.state = :enrolling OR experiment.state = :enrollmentComplete OR experiment.state = :preview) AND NOT (experiment.state = :enrollmentComplete AND experiment.postExperimentRule = :assign AND experiment.revertTo IS NULL) AND :context ILIKE ANY (ARRAY[experiment.context])';
    const whereClauseParams = {
      enrolling: 'enrolling',
      enrollmentComplete: 'enrollmentComplete',
      preview: 'preview',
      assign: 'assign',
      context,
    };
    const experimentConditionLevelPayloadQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload')
      .where(
        new Brackets((qb) => {
          qb.where(whereExperimentsClause, whereClauseParams);
        })
      );

    const experimentFactorPartitionLevelPayloadQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels')
      .where(
        new Brackets((qb) => {
          qb.where(whereExperimentsClause, whereClauseParams);
        })
      );

    const experimentSegmentQuery = this.createQueryBuilder('experiment')
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
          qb.where(whereExperimentsClause, whereClauseParams);
        })
      );

    const [experimentConditionLevelPayloadData, experimentFactorPartitionLevelPayloadData, experimentSegmentData] =
      await Promise.all([
        experimentConditionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentConditionLevelPayloadQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
        experimentFactorPartitionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentFactorPartitionLevelPayloadQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
        experimentSegmentQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentSegmentQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
      ]);

    const experimentData = experimentConditionLevelPayloadData.map((data) => {
      const data2 = experimentFactorPartitionLevelPayloadData.find((i) => i.id === data.id);
      return { ...data, ...data2 };
    });

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
