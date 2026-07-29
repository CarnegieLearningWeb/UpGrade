import { DecisionPoint } from '../models/DecisionPoint';
import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import repositoryError from './utils/repositoryError';
import { EXPERIMENT_STATE } from 'upgrade_types';

export interface DecisionPointUsageCount {
  decisionPointId: string;
  usedByCount: number;
}

@EntityRepository(DecisionPoint)
export class DecisionPointRepository extends Repository<DecisionPoint> {
  public async upsertDecisionPoint(
    decisionPointDoc: Partial<DecisionPoint>,
    entityManager: EntityManager
  ): Promise<DecisionPoint> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(DecisionPoint)
      .values(decisionPointDoc)
      .orUpdate(['target', 'description', 'excludeIfReached', 'order'], ['id'])
      .setParameter('target', decisionPointDoc.target)
      .setParameter('description', decisionPointDoc.description)
      .setParameter('excludeIfReached', decisionPointDoc.excludeIfReached)
      .setParameter('order', decisionPointDoc.order)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'upsertExperimentPartition',
          { partitionDoc: decisionPointDoc },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw[0];
  }

  public async deleteByIds(ids: string[], entityManager: EntityManager): Promise<DecisionPoint[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(DecisionPoint)
      .where('id IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteByIds', { ids }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async insertDecisionPoint(
    decisionPointDoc: Array<Partial<DecisionPoint>>,
    entityManager: EntityManager
  ): Promise<DecisionPoint[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(DecisionPoint)
      .values(decisionPointDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'insertPartitions',
          { partitionsDocs: decisionPointDoc },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteDecisionPoint(id: string, entityManager: EntityManager): Promise<void> {
    await entityManager
      .createQueryBuilder()
      .delete()
      .from(DecisionPoint)
      .where('id = :id', { id })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deletePartition', { id }, errorMsg);
        throw errorMsgString;
      });
  }

  public async partitionPointAndName(): Promise<Array<Pick<DecisionPoint, 'site' | 'target'>>> {
    return await this.createQueryBuilder('experimentPartition')
      .select(['experimentPartition.site', 'experimentPartition.target'])
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'partitionPointAndName', undefined, errorMsg);
        throw errorMsgString;
      });
  }

  public async partitionPointAndNameId(): Promise<Array<Pick<DecisionPoint, 'id' | 'site' | 'target'>>> {
    return await this.createQueryBuilder('experimentPartition')
      .select(['experimentPartition.id', 'experimentPartition.site', 'experimentPartition.target'])
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'partitionPointAndNameId', undefined, errorMsg);
        throw errorMsgString;
      });
  }

  public async getUsageCountsForExperiment(
    experimentId: string,
    entityManager?: EntityManager
  ): Promise<DecisionPointUsageCount[]> {
    // Treat site-target pairs as case-insensitive and normalize missing targets to empty.
    const repository = entityManager ? entityManager.getRepository(DecisionPoint) : this;

    return await repository
      .createQueryBuilder('sourceDecisionPoint')
      .select('sourceDecisionPoint.id', 'decisionPointId')
      .addSelect('COUNT(DISTINCT usedByExperiment.id)::int', 'usedByCount')
      .leftJoin(
        DecisionPoint,
        'usedByDecisionPoint',
        `LOWER(usedByDecisionPoint.site) = LOWER(sourceDecisionPoint.site)
          AND LOWER(COALESCE(usedByDecisionPoint.target, '')) = LOWER(COALESCE(sourceDecisionPoint.target, ''))`
      )
      .leftJoin('usedByDecisionPoint.experiment', 'usedByExperiment', 'usedByExperiment.state != :archivedState', {
        archivedState: EXPERIMENT_STATE.ARCHIVED,
      })
      .where('"sourceDecisionPoint"."experimentId" = :experimentId', { experimentId })
      .groupBy('sourceDecisionPoint.id')
      .getRawMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'getUsageCountsForExperiment',
          { experimentId },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async setAllPendingActivationFalse(experimentId: string, entityManager?: EntityManager): Promise<void> {
    const that = entityManager ? entityManager : this;
    await that
      .createQueryBuilder()
      .update(DecisionPoint)
      .set({ pendingActivation: false })
      .where('"experimentId" = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'setAllPendingActivationFalse',
          { experimentId },
          errorMsg
        );
        throw errorMsgString;
      });
  }
}
