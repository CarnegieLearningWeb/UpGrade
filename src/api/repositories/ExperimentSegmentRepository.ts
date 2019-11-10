import { ExperimentSegment } from '../models/ExperimentSegment';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExperimentSegment)
export class ExperimentSegmentRepository extends Repository<ExperimentSegment> {}
