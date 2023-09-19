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
import uuid from 'uuid';
import { ErrorWithType } from '../errors/ErrorWithType';
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

  public async getCSVDataByFactor(factor: string, logger: UpgradeLogger): Promise<any> {
    logger.info({ message: `Download CSV stratification by factor. factorId: ${factor}` });

    return await this.userStratificationRepository
      .createQueryBuilder('usf')
      .select(['user.id AS user', 'usf.stratificationFactorValue AS value'])
      .innerJoin('usf.user', 'user')
      .innerJoin('usf.stratificationFactor', 'sf')
      .where('sf.id = :factor', { factor })
      .getRawMany();
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
      const usersRemaining = userStratificationData
        .filter((userData) => {
          return !userDetails.some((user) => user.id === userData.userId);
        })
        .map((x) => {
          return {
            id: x.userId,
          };
        });
      const usersDocToSave = [...new Set(usersRemaining)];

      const stratificationFactorDetials = await transactionalEntityManager.getRepository(StratificationFactor).find({
        where: { stratificationFactorName: In(userStratificationData.map((factorData) => factorData.factor)) },
      });
      const stratificationFactorRemaining = userStratificationData.filter((factorData) => {
        return !stratificationFactorDetials.some((factor) => factor.id === factorData.factor);
      });
      const stratificationFactorToSave = [...new Set(stratificationFactorRemaining)].map((x) => {
        return { id: uuid(), stratificationFactorName: x.factor };
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

      const userStratificationDataToSave: Partial<UserStratificationFactor>[] = userStratificationData.map((data) => {
        let userFound: ExperimentUser = userDetails.find((user) => user.id === data.userId);
        let stratificationFactorFound: StratificationFactor = stratificationFactorDetials.find(
          (factor) => factor.stratificationFactorName === data.factor
        );

        // if (!userFound) {
        //   try {
        //     userFound = await transactionalEntityManager.getRepository(ExperimentUser).save({ id: data.userId });
        //     userDetails.push(userFound);
        //   } catch (err) {
        //     const error = err as ErrorWithType;
        //     error.details = 'Error in creating not-founded Experiment User';
        //     error.type = SERVER_ERROR.QUERY_FAILED;
        //     logger.error(error);
        //     throw error;
        //   }
        // }
        // if (!stratificationFactorFound) {
        //   try {
        //     stratificationFactorFound = await transactionalEntityManager
        //       .getRepository(StratificationFactor)
        //       .save({ id: uuid(), stratificationFactorName: data.factor });
        //     stratificationFactorDetials.push(stratificationFactorFound);
        //   } catch (err) {
        //     const error = err as ErrorWithType;
        //     error.details = 'Error in creating not-founded Stratification Factor';
        //     error.type = SERVER_ERROR.QUERY_FAILED;
        //     logger.error(error);
        //     throw error;
        //   }
        // }
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
