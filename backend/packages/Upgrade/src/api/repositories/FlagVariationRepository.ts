import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import repositoryError from './utils/repositoryError';
import { FlagVariation } from '../models/FlagVariation';

@EntityRepository(FlagVariation)
export class FlagVariationRepository extends Repository<FlagVariation> {
  public async insertVariations(
    variationDocs: Array<Partial<FlagVariation>>,
    entityManager: EntityManager
  ): Promise<FlagVariation[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(FlagVariation)
      .values(variationDocs)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FlagVariationRepository',
          'insertVariations',
          { variationDocs },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteVariation(id: string, entityManager: EntityManager): Promise<void> {
    await entityManager
      .createQueryBuilder()
      .delete()
      .from(FlagVariation)
      .where('id=:id', { id })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FlagVariationRepository', 'deleteVariation', { id }, errorMsg);
        throw errorMsgString;
      });
  }

  public async upsertFlagVariation(
    variationDoc: Partial<FlagVariation>,
    entityManager: EntityManager
  ): Promise<FlagVariation> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(FlagVariation)
      .values(variationDoc)
      .orUpdate(['value', 'name', 'description', 'defaultVariation'], 'id')
      .setParameter('value', variationDoc.value)
      .setParameter('name', variationDoc.name)
      .setParameter('description', variationDoc.description)
      .setParameter('defaultVariation', variationDoc.defaultVariation)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FlagVariationRepository',
          'upsertFlagVariation',
          { variationDoc },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw[0];
  }
}
