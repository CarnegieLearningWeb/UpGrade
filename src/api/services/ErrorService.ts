import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentError } from '../models/ExperimentError';
import uuid from 'uuid/v4';

@Service()
export class ErrorService {
    constructor(
        @OrmRepository() private errorRepository: ErrorRepository,
        @Logger(__filename) private log: LoggerInterface
    ) { }
    public create(error: ExperimentError): Promise<ExperimentError> {
        this.log.info('Inserting an error => ', error.toString());
        error.id = error.id || uuid();
        return this.errorRepository.saveRawJson(error);
    }
}
