import { Repository, EntityRepository } from 'typeorm';
import { ExperimentError } from '../models/ExperimentError';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExperimentError)
export class ErrorRepository extends Repository<ExperimentError> {
  public async saveRawJson(error: ExperimentError): Promise<ExperimentError> {
    const result = await this.createQueryBuilder()
      .insert()
      .values(error)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ErrorRepository', 'saveRawJson', { error }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
