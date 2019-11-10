import { ExperimentCondition } from '../models/ExperimentCondition';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExperimentCondition)
export class ExperimentConditionRepository extends Repository<ExperimentCondition> {}
