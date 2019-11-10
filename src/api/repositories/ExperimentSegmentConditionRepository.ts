import { ExperimentSegmentCondition } from '../models/ExperimentSegmentCondition';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExperimentSegmentCondition)
export class ExperimentSegmentConditionRepository extends Repository<ExperimentSegmentCondition> {}
