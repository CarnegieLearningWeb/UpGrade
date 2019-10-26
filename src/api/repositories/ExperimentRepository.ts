import { Experiment } from '../models/Experiment';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(Experiment)
export class ExperimentRepository extends Repository<Experiment> {}
