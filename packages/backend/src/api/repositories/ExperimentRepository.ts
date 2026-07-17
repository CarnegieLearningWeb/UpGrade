import { EXPERIMENT_STATE, SERVER_ERROR } from 'upgrade_types';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Experiment } from '../models/Experiment';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { createGlobalExcludeSegment } from '../../init/seed/globalExcludeSegment';
import { ExperimentDetailsForCSVData } from './AnalyticsRepository';
import { StateTimeLog } from '../models/StateTimeLogs';
import { ConditionPayload } from '../models/ConditionPayload';
import { DecisionPoint } from '../models/DecisionPoint';
import { ExperimentCondition } from '../models/ExperimentCondition';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {
  public async findAllExperiments(): Promise<Experiment[]> {
    const experimentConditionLevelPayloadQuery = this.buildConditionLevelPayloadQuery();

    const experimentFactorDecisionPointLevelPayloadQuery = this.buildFactorDecisionPointPayloadQuery();

    const experimentMetricQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('queries.metric', 'metric')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .addOrderBy('queries.order', 'ASC', 'NULLS LAST')
      .addOrderBy('queries.createdAt', 'ASC');

    const experimentSegment = this.buildSegmentQuery();

    const [
      experimentConditionLevelPayloadData,
      experimentFactorPartitionLevelPayloadData,
      experimentMetricData,
      experimentSegmentData,
    ] = await Promise.all([
      experimentConditionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findAllExperiments-experimentConditionLevelPayloadData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
      experimentFactorDecisionPointLevelPayloadQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findAllExperiments-experimentFactorDecisionPointLevelPayloadData',
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
    const experimentConditionLevelPayloadQuery = this.buildConditionLevelPayloadQuery().where(
      new Brackets((qb) => {
        qb.where(whereExperimentsClause, whereClauseParams);
      })
    );

    const experimentFactorDecisionPointLevelPayloadQuery = this.buildFactorDecisionPointPayloadQuery().where(
      new Brackets((qb) => {
        qb.where(whereExperimentsClause, whereClauseParams);
      })
    );

    const experimentSegmentQuery = this.buildSegmentQuery().where(
      new Brackets((qb) => {
        qb.where(whereExperimentsClause, whereClauseParams);
      })
    );

    const [experimentConditionLevelPayloadData, experimentFactorDecisionPointLevelPayloadData, experimentSegmentData] =
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
        experimentFactorDecisionPointLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperiments-experimentFactorDecisionPointLevelPayloadQuery',
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

    const factorDpMap = new Map(experimentFactorDecisionPointLevelPayloadData.map((d) => [d.id, d]));
    const segmentMap = new Map(experimentSegmentData.map((d) => [d.id, d]));

    return experimentConditionLevelPayloadData.map((data) => {
      return { ...data, ...factorDpMap.get(data.id), ...segmentMap.get(data.id) };
    });
  }

  public async getValidExperimentsForContextAndDecisionPoint(
    context: string,
    site: string,
    target: string
  ): Promise<Experiment[]> {
    const baseWhereClause =
      '(experiment.state = :enrolling OR experiment.state = :enrollmentComplete) AND NOT (experiment.state = :enrollmentComplete AND experiment.postExperimentRule = :assign AND experiment.revertTo IS NULL) AND :context ILIKE ANY (ARRAY[experiment.context])';
    const decisionPointWhereClause =
      baseWhereClause +
      ' AND partitions.site = :site AND partitions.target = :target AND partitions.pendingActivation = false';
    const whereClauseParams = {
      enrolling: 'enrolling',
      enrollmentComplete: 'enrollmentComplete',
      assign: 'assign',
      context,
      site,
      target,
    };

    const conditionLevelPayloadQuery = this.buildConditionLevelPayloadQuery()
      .leftJoin('experiment.partitions', 'partitions')
      .where(
        new Brackets((qb) => {
          qb.where(decisionPointWhereClause, whereClauseParams);
        })
      );

    const factorDecisionPointPayloadQuery = this.buildFactorDecisionPointPayloadQuery().where(
      new Brackets((qb) => {
        qb.where(decisionPointWhereClause, whereClauseParams);
      })
    );

    const segmentQuery = this.buildSegmentQuery()
      .leftJoin('experiment.partitions', 'partitions')
      .where(
        new Brackets((qb) => {
          qb.where(decisionPointWhereClause, whereClauseParams);
        })
      );

    const [conditionLevelPayloadData, factorDecisionPointPayloadData, segmentData] = await Promise.all([
      conditionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'getValidExperimentsForContextAndDecisionPoint-conditionLevelPayloadData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
      factorDecisionPointPayloadQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'getValidExperimentsForContextAndDecisionPoint-factorDecisionPointPayloadData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
      segmentQuery.getMany().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'getValidExperimentsForContextAndDecisionPoint-segmentData',
          {},
          errorMsg
        );
        throw errorMsgString;
      }),
    ]);

    const experimentData = factorDecisionPointPayloadData.map((data) => {
      const condData = conditionLevelPayloadData.find((i) => i.id === data.id);
      return { ...condData, ...data };
    });

    return experimentData.map((data) => {
      const seg = segmentData.find((s) => s.id === data.id);
      return seg ? { ...data, ...seg } : data;
    });
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
    const experimentConditionLevelPayloadQuery = this.buildConditionLevelPayloadQuery().where(
      new Brackets((qb) => {
        qb.where(whereExperimentsClause, whereClauseParams);
      })
    );

    const experimentFactorDecisionPointLevelPayloadQuery = this.buildFactorDecisionPointPayloadQuery().where(
      new Brackets((qb) => {
        qb.where(whereExperimentsClause, whereClauseParams);
      })
    );

    const experimentSegmentQuery = this.buildSegmentQuery().where(
      new Brackets((qb) => {
        qb.where(whereExperimentsClause, whereClauseParams);
      })
    );

    const [experimentConditionLevelPayloadData, experimentFactorDecisionPointLevelPayloadData, experimentSegmentData] =
      await Promise.all([
        experimentConditionLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperimentsWithPreview-experimentConditionLevelPayloadQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
        experimentFactorDecisionPointLevelPayloadQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperimentsWithPreview-experimentFactorDecisionPointLevelPayloadQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
        experimentSegmentQuery.getMany().catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'ExperimentRepository',
            'getValidExperimentsWithPreview-experimentSegmentQuery',
            {},
            errorMsg
          );
          throw errorMsgString;
        }),
      ]);

    const factorDpMap = new Map(experimentFactorDecisionPointLevelPayloadData.map((d) => [d.id, d]));
    const segmentMap = new Map(experimentSegmentData.map((d) => [d.id, d]));

    return experimentConditionLevelPayloadData.map((data) => {
      return { ...data, ...factorDpMap.get(data.id), ...segmentMap.get(data.id) };
    });
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

  private buildConditionLevelPayloadQuery() {
    return this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.conditions', 'conditions')
      .leftJoinAndSelect('conditions.levelCombinationElements', 'levelCombinationElements')
      .leftJoinAndSelect('levelCombinationElements.level', 'level')
      .leftJoinAndSelect('conditions.conditionPayloads', 'conditionPayload');
  }

  private buildFactorDecisionPointPayloadQuery() {
    return this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.partitions', 'partitions')
      .leftJoinAndSelect('experiment.stratificationFactor', 'stratificationFactor')
      .leftJoinAndSelect('partitions.conditionPayloads', 'conditionPayloads')
      .leftJoinAndSelect('conditionPayloads.parentCondition', 'parentCondition')
      .leftJoinAndSelect('experiment.factors', 'factors')
      .leftJoinAndSelect('factors.levels', 'levels');
  }

  private buildSegmentQuery() {
    return this.createQueryBuilder('experiment')
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
  }

  public async findOneExperiment(id: string): Promise<Experiment | undefined> {
    const conditionLevelPayloadQuery = this.buildConditionLevelPayloadQuery()
      .addOrderBy('conditions.order', 'ASC')
      .where({ id });

    const factorDecisionPointPayloadQuery = this.buildFactorDecisionPointPayloadQuery()
      .addOrderBy('partitions.order', 'ASC')
      .addOrderBy('factors.order', 'ASC')
      .addOrderBy('levels.order', 'ASC')
      .where({ id });

    const metricQuery = this.createQueryBuilder('experiment')
      .leftJoinAndSelect('experiment.queries', 'queries')
      .leftJoinAndSelect('queries.metric', 'metric')
      .leftJoinAndSelect('experiment.stateTimeLogs', 'stateTimeLogs')
      .addOrderBy('queries.order', 'ASC', 'NULLS LAST')
      .addOrderBy('queries.createdAt', 'ASC')
      .where({ id });

    const segmentQuery = this.buildSegmentQuery().where({ id });

    const [conditionLevelPayloadData, factorDecisionPointPayloadData, metricData, segmentData] = await Promise.all([
      conditionLevelPayloadQuery.getOne().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findOneExperiment-conditionLevelPayloadData',
          { id },
          errorMsg
        );
        throw errorMsgString;
      }),
      factorDecisionPointPayloadQuery.getOne().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findOneExperiment-factorDecisionPointPayloadData',
          { id },
          errorMsg
        );
        throw errorMsgString;
      }),
      metricQuery.getOne().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findOneExperiment-metricData',
          { id },
          errorMsg
        );
        throw errorMsgString;
      }),
      segmentQuery.getOne().catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentRepository',
          'findOneExperiment-segmentData',
          { id },
          errorMsg
        );
        throw errorMsgString;
      }),
    ]);

    if (!conditionLevelPayloadData) {
      return undefined;
    }

    return { ...conditionLevelPayloadData, ...factorDecisionPointPayloadData, ...metricData, ...segmentData };
  }

  public async fetchExperimentDetailsForCSVDataExport(experimentId: string): Promise<ExperimentDetailsForCSVData[]> {
    // Get the experiment details
    const experimentQuery = await this.createQueryBuilder('experiment')
      .select([
        'experiment.id as "experimentId"',
        'experiment.name as "experimentName"',
        'experiment.context as "context"',
        'experiment.assignmentUnit as "assignmentUnit"',
        'experiment.group as "group"',
        'experiment.consistencyRule as "consistencyRule"',
        'experiment.type as "designType"',
        'experiment.assignmentAlgorithm as "algorithmType"',
        'experiment.stratificationFactorStratificationFactorName as "stratification"',
        'experiment.postExperimentRule as "postRule"',
        'experiment.conditionOrder as "conditionOrder"',
        'experimentRevertCondition.conditionCode as "revertTo"',
        'MIN("enrollingStateTimeLog"."timeLog") as "enrollmentStartDate"',
        'MIN("enrollmentCompleteStateTimeLog"."timeLog") as "enrollmentCompleteDate"',
        '"conditionPayloadMain"."payloadValue" as "payload"',
        '"decisionPointData"."excludeIfReached" as "excludeIfReached"',
        '"decisionPointData"."id" as "expDecisionPointId"',
        'experimentCondition.id as "expConditionId"',
        'experimentCondition.conditionCode as "conditionName"',
      ])
      .leftJoin(ExperimentCondition, 'experimentCondition', 'experimentCondition.experimentId = experiment.id')
      .leftJoin(ExperimentCondition, 'experimentRevertCondition', 'experimentRevertCondition.id = experiment.revertTo')
      .leftJoin(DecisionPoint, 'decisionPointData', 'decisionPointData.experimentId = experiment.id')
      .leftJoin(
        ConditionPayload,
        'conditionPayloadMain',
        'conditionPayloadMain.parentConditionId = experimentCondition.id AND conditionPayloadMain.decisionPointId = decisionPointData.id'
      )
      .leftJoin(
        StateTimeLog,
        'enrollingStateTimeLog',
        "enrollingStateTimeLog.experimentId = experiment.id AND enrollingStateTimeLog.toState = 'enrolling'"
      )
      .leftJoin(
        StateTimeLog,
        'enrollmentCompleteStateTimeLog',
        "enrollmentCompleteStateTimeLog.experimentId = experiment.id AND enrollmentCompleteStateTimeLog.toState = 'enrollmentComplete'"
      )
      .groupBy('experiment.id')
      .addGroupBy('experimentCondition.id')
      .addGroupBy('experimentRevertCondition.conditionCode')
      .addGroupBy('decisionPointData.id')
      .addGroupBy('conditionPayloadMain.payloadValue')
      .where('experiment.id = :experimentId', { experimentId })
      .getRawMany();

    return experimentQuery;
  }
}
