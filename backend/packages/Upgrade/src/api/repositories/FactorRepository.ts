import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { Factor } from '../models/Factor';

@EntityRepository(Factor)
export class FactorRepository extends Repository<Factor> {
  public async getAllFactor(logger: UpgradeLogger): Promise<Factor[]> {
    return await this.createQueryBuilder('factor')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('factorRepository', 'getAllFactor', {}, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertFactor(factorDoc: Array<Partial<Factor>>, entityManager: EntityManager): Promise<Factor[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Factor)
      .values(factorDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'insertFactor',
          { factorDoc: factorDoc },
          errorMsg
        );
        throw errorMsgString;
      });
    return result.raw || [];
  }

  public async upsertFactor(factorDoc: Partial<Factor>, entityManager: EntityManager): Promise<Factor> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Factor)
      .values(factorDoc)
      .onConflict(`("id") DO UPDATE SET "name" = :name`)
      .setParameter('name', factorDoc.name)
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsgString = repositoryError('FactorRepository', 'upsertFactor', { factorDoc }, error);
        throw errorMsgString;
      });

    return result.raw[0] || [];
  }

  public async deleteFactor(id: string, logger: UpgradeLogger): Promise<Factor> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(Factor)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('factorRepository', 'deleteFactor', { id }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}
