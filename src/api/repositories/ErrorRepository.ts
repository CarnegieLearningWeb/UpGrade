import { Repository, EntityRepository } from 'typeorm';
import { ExperimentError } from '../models/ExperimentError';

@EntityRepository(ExperimentError)
export class ErrorRepository extends Repository<ExperimentError> {
    public async saveRawJson(error: ExperimentError): Promise<ExperimentError> {
        const result = await this.createQueryBuilder()
            .insert()
            .values(error)
            .returning('*')
            .execute();

        return result.raw;
    }
}
