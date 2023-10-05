import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SERVER_ERROR } from 'upgrade_types';
import { In, getConnection } from 'typeorm';
import { FactorStrata, StratificationInputValidator } from '../controllers/validators/StratificationValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { StratificationFactor } from '../models/StratificationFactor';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { StratificationFactorRepository } from '../repositories/StratificationFactorRepository';
import { ErrorWithType } from '../errors/ErrorWithType';
@Service()
export class StratificationService {
  constructor(
    @OrmRepository()
    private stratificationFactorRepository: StratificationFactorRepository
  ) {}

  private calculateStratificationResult(results: any[]): FactorStrata[] {
    const formattedResults = results.reduce((formatted, result) => {
      const { factor, value, count } = result;
      if (!formatted[factor]) {
        formatted[factor] = { factor, values: {} };
      }
      if (value !== 'N/A') {
        formatted[factor].values[value] = parseInt(count);
      }
      return formatted;
    }, {});

    return Object.values(formattedResults);
  }

  public async getAllStratification(logger: UpgradeLogger): Promise<FactorStrata[]> {
    logger.info({ message: `Find all stratification` });

    const queryBuilder = await this.stratificationFactorRepository
      .createQueryBuilder('sf')
      .select([
        'sf.stratificationFactorName AS factor',
        `COALESCE(usf.stratificationFactorValue, 'N/A') AS value`,
        'COUNT(*) AS count',
      ])
      .innerJoin('sf.userStratificationFactor', 'usf')
      .groupBy('sf.stratificationFactorName, value')
      .getRawMany();

    const allStratificaitonFactors = await this.stratificationFactorRepository.find();

    const remainingFactors = allStratificaitonFactors
      .filter((factor) => {
        return !queryBuilder.some((result) => result.factor === factor.stratificationFactorName);
      })
      .map((factors) => {
        return {
          factor: factors.stratificationFactorName,
          value: 'N/A',
          count: 0,
        };
      });

    return this.calculateStratificationResult([...queryBuilder, ...remainingFactors]);
  }

  public async getStratificationByFactor(factor: string, logger: UpgradeLogger): Promise<FactorStrata> {
    logger.info({ message: `Find stratification by factor: ${factor}` });

    const queryBuilder = await this.stratificationFactorRepository
      .createQueryBuilder('sf')
      .select([
        'sf.stratificationFactorName AS factor',
        `COALESCE(usf.stratificationFactorValue, 'N/A') AS value`,
        'COUNT(*) AS count',
      ])
      .innerJoin('sf.userStratificationFactor', 'usf')
      .where('sf.stratificationFactorName = :factor', { factor })
      .groupBy('sf.stratificationFactorName, value')
      .getRawMany();

    return this.calculateStratificationResult(queryBuilder)[0];
  }

  public async getCSVDataByFactor(factor: string, logger: UpgradeLogger): Promise<any> {
    logger.info({ message: `Download CSV stratification by factor. Factor: ${factor}` });

    return await this.stratificationFactorRepository
      .createQueryBuilder('sf')
      .select(['usf.user AS uuid', `usf.stratificationFactorValue AS "${factor}"`])
      .leftJoin('sf.userStratificationFactor', 'usf')
      .where('sf.stratificationFactorName = :factor', { factor })
      .getRawMany();
  }

  public async deleteStratification(factor: string, logger: UpgradeLogger): Promise<StratificationFactor> {
    logger.info({ message: `Delete stratification by factor. Factor: ${factor}` });

    return await this.stratificationFactorRepository.deleteStratificationFactorByName(factor, logger);
  }

  public async insertStratification(
    userStratificationData: StratificationInputValidator[],
    logger: UpgradeLogger
  ): Promise<UserStratificationFactor[]> {
    logger.info({ message: `Insert stratification => ${JSON.stringify(userStratificationData, undefined, 2)}` });

    const createdStratificationData = await getConnection().transaction(async (transactionalEntityManager) => {
      if (userStratificationData.length > 0) {
        try {
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(UserStratificationFactor)
            .where('userId IN (:...userIds)', { userIds: userStratificationData.map((data) => data.userId) })
            .andWhere('factorName IN (:...stratificationFactorNames)', {
              stratificationFactorNames: userStratificationData.map((data) => data.factor),
            })
            .execute();
        } catch (err) {
          const error = err as ErrorWithType;
          error.details = 'Error in deleting existing UserStratificationFactor';
          error.type = SERVER_ERROR.QUERY_FAILED;
          logger.error(error);
          throw error;
        }
      }

      // filter out the data with empty value
      userStratificationData = userStratificationData.filter((data) => data.value != null);

      const userDetails = await transactionalEntityManager.getRepository(ExperimentUser).find({
        where: { id: In(userStratificationData.map((userData) => userData.userId)) },
      });
      const usersRemaining = userStratificationData
        .filter((userData) => {
          return !userDetails.some((user) => user.id === userData.userId);
        })
        .map((user) => {
          return {
            id: user.userId,
          };
        });
      const usersDocToSave = [...new Set(usersRemaining)];

      const stratificationFactorDetials = await transactionalEntityManager.getRepository(StratificationFactor).find({
        where: { stratificationFactorName: In(userStratificationData.map((factorData) => factorData.factor)) },
      });
      const stratificationFactorRemaining = userStratificationData.filter((factorData) => {
        return !stratificationFactorDetials.some((factor) => factor.stratificationFactorName === factorData.factor);
      });

      // create a SET of stratificationFactors not found in DB
      const stratificationFactorToSave = [
        ...new Set(stratificationFactorRemaining.map((stratificationFactor) => stratificationFactor.factor)),
      ].map((factor) => {
        return {
          stratificationFactorName: factor,
        };
      });

      let userDocCreated: ExperimentUser[], stratificationFactorDocCreated: StratificationFactor[];
      try {
        [userDocCreated, stratificationFactorDocCreated] = await Promise.all([
          transactionalEntityManager.getRepository(ExperimentUser).save(usersDocToSave),
          transactionalEntityManager.getRepository(StratificationFactor).save(stratificationFactorToSave),
        ]);
      } catch (err) {
        const error = err as ErrorWithType;
        error.details = 'Error in creating not-founded Experiment User & Stratification factors';
        error.type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      userDetails.push(...userDocCreated);
      stratificationFactorDetials.push(...stratificationFactorDocCreated);

      const userStratificationDataToSave: Partial<UserStratificationFactor>[] = userStratificationData
        .filter((data) => data.value != null)
        .map((data) => {
          const userFound: ExperimentUser = userDetails.find((user) => user.id === data.userId);
          const stratificationFactorFound: StratificationFactor = stratificationFactorDetials.find(
            (factor) => factor.stratificationFactorName === data.factor
          );
          return {
            user: userFound,
            stratificationFactor: stratificationFactorFound,
            stratificationFactorValue: data.value,
          };
        });

      return await transactionalEntityManager
        .getRepository(UserStratificationFactor)
        .save(userStratificationDataToSave);
    });

    return createdStratificationData;
  }
}
