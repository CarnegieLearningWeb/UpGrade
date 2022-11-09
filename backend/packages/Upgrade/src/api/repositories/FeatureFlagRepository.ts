import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { FeatureFlag } from '../models/FeatureFlag';
import repositoryError from './utils/repositoryError';

@EntityRepository(FeatureFlag)
export class FeatureFlagRepository extends Repository<FeatureFlag> {
  public async insertFeatureFlag(flagDoc: FeatureFlag, entityManager: EntityManager): Promise<FeatureFlag> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(FeatureFlag)
      .values(flagDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'insertFeatureFlag', { flagDoc }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteById(id: string): Promise<FeatureFlag> {
    const result = await this.createQueryBuilder('featureFlag')
      .delete()
      .from(FeatureFlag)
      .where('id = :id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'deleteById', { id }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async updateState(flagId: string, status: boolean): Promise<FeatureFlag> {
    const result = await this.createQueryBuilder('featureFlag')
      .update()
      .set({ status })
      .where({ id: flagId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'updateState', { flagId, status }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async updateFeatureFlag(flagDoc: Partial<FeatureFlag>, entityManager: EntityManager): Promise<FeatureFlag> {
    const result = await entityManager
      .createQueryBuilder()
      .update(FeatureFlag)
      .set(flagDoc)
      .where({ id: flagDoc.id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'updateFeatureFlag', { flagDoc }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
