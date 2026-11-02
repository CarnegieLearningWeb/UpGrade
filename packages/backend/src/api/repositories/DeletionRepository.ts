import { EntityManager, Repository } from 'typeorm';
import { BatchDeleteEntity } from 'upgrade_types';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Experiment } from '../models/Experiment';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import repositoryError from './utils/repositoryError';

/** All reads and locks use the caller's deletion transaction, never the repository's default manager. */
@EntityRepository()
export class DeletionRepository extends Repository<DeletionRepository> {
  public async findForDeletion(
    entity: BatchDeleteEntity,
    id: string,
    manager: EntityManager
  ): Promise<{ id: string } | null> {
    const target = { experiments: Experiment, flags: FeatureFlag, segments: Segment }[entity];
    return manager
      .getRepository<{ id: string }>(target)
      .findOne({ where: { id }, select: { id: true }, lock: { mode: 'pessimistic_write' } })
      .catch((errorMsg: any) => {
        throw repositoryError('DeletionRepository', 'findForDeletion', { entity, id }, errorMsg);
      });
  }
}
