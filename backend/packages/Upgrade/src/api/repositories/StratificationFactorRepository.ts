import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { StratificationFactor } from '../models/StratificationFactor';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(StratificationFactor)
export class StratificationFactorRepository extends Repository<StratificationFactor> {
  public async insertStratificationFactor(
    stratificationFactorDoc: Array<Partial<StratificationFactor>>,
    entityManager: EntityManager
  ): Promise<StratificationFactor[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(StratificationFactor)
      .values(stratificationFactorDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'insertStratificationFactor',
          { StratificationFactorDoc: stratificationFactorDoc },
          errorMsg
        );
        throw errorMsgString;
      });
    return result.raw || [];
  }

  public async deleteStratificationFactorByName(factor: string, logger: UpgradeLogger): Promise<StratificationFactor> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(StratificationFactor)
      .where('stratificationFactorName=:factor', { factor })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'stratificationFactorRepository',
          'deleteStratificationFactorByName',
          { factor },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
