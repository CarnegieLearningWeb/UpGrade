import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SERVER_ERROR } from 'upgrade_types';
import { In, getConnection } from 'typeorm';
import { UserStratificationFactorRepository } from '../repositories/UserStratificationRepository';
import { FactorStrata, StratificationInputValidator } from '../controllers/validators/StratificationValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { StratificationFactor } from '../models/StratificationFactor';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { StratificationFactorRepository } from '../repositories/StratificationFactorRepository';
@Service()
export class StratificationService {
  constructor(
    @OrmRepository()
    private userStratificationRepository: UserStratificationFactorRepository,
    @OrmRepository()
    private stratificationFactorRepository: StratificationFactorRepository
  ) {}

  private calculateStratificationResult(results: any[]): FactorStrata[] {
    const formattedResults = results.reduce((formatted, result) => {
      const { factorId, factor, value, count } = result;
      if (!formatted[factorId]) {
        formatted[factorId] = { factorId, factor, values: {} };
      }
      if (value === 'N/A') {
        formatted[factorId].notApplicable = parseInt(count);
      } else {
        formatted[factorId].values[value] = parseInt(count);
      }
      return formatted;
    }, {});

    return Object.values(formattedResults);
  }

  public async getAllStratification(logger: UpgradeLogger): Promise<FactorStrata[]> {
    logger.info({ message: `Find all stratification` });

    const queryBuilder = await this.userStratificationRepository
      .createQueryBuilder('usf')
      .select([
        'sf.id AS "factorId"',
        'sf.stratificationFactorName AS factor',
        `COALESCE(usf.stratificationFactorValue, 'N/A') AS value`,
        'COUNT(*) AS count',
      ])
      .innerJoin('usf.stratificationFactor', 'sf')
      .groupBy('sf.id, sf.stratificationFactorName, value')
      .getRawMany();

    return this.calculateStratificationResult(queryBuilder);
  }

  public async getStratificationByFactor(factor: string, logger: UpgradeLogger): Promise<FactorStrata> {
    logger.info({ message: `Find stratification by factor. factorId: ${factor}` });

    const queryBuilder = await this.userStratificationRepository
      .createQueryBuilder('usf')
      .select([
        'sf.id AS "factorId"',
        'sf.stratificationFactorName AS factor',
        `COALESCE(usf.stratificationFactorValue, 'N/A') AS value`,
        'COUNT(*) AS count',
      ])
      .innerJoin('usf.stratificationFactor', 'sf')
      .where('sf.id = :factor', { factor })
      .groupBy('sf.id, sf.stratificationFactorName, value')
      .getRawMany();

    return this.calculateStratificationResult(queryBuilder)[0];
  }

  public async deleteStratification(factor: string, logger: UpgradeLogger): Promise<StratificationFactor> {
    logger.info({ message: `Delete stratification by factor. factorId: ${factor}` });

    return await this.stratificationFactorRepository.deleteStratificationFactorById(factor, logger);
  }

  public async insertStratification(
    userStratificationData: StratificationInputValidator[],
    logger: UpgradeLogger
  ): Promise<UserStratificationFactor[]> {
    logger.info({ message: `Insert stratification => ${JSON.stringify(userStratificationData, undefined, 2)}` });

    const createdStratificationData = await getConnection().transaction(async (transactionalEntityManager) => {
      const userDetails = await transactionalEntityManager.getRepository(ExperimentUser).find({
        where: { id: In(userStratificationData.map((userData) => userData.userId)) },
      });

      const stratificationFactorDetials = await transactionalEntityManager.getRepository(StratificationFactor).find({
        where: { stratificationFactorName: In(userStratificationData.map((factorData) => factorData.factor)) },
      });

      const userStratificationDataToSave = userStratificationData.map((data) => {
        const userFound = userDetails.find((user) => user.id === data.userId);
        const stratificationFactorFound = stratificationFactorDetials.find(
          (factor) => factor.stratificationFactorName === data.factor
        );

        if (!userFound) {
          const error = new Error('User: ' + data.userId + ' not found.');
          (error as any).type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
        } else if (!stratificationFactorFound) {
          const error = new Error('StratificationFactor: ' + data.factor + ' not found. ');
          (error as any).type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
        } else {
          return {
            user: userFound,
            stratificationFactor: stratificationFactorFound,
            stratificationFactorValue: data.value,
          };
        }
      });

      return await transactionalEntityManager
        .getRepository(UserStratificationFactor)
        .save(userStratificationDataToSave);
    });

    return createdStratificationData;
  }
}
