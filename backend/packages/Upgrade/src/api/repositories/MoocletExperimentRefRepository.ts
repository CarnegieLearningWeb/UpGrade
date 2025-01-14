import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';

@EntityRepository(MoocletExperimentRef)
export class MoocletExperimentRefRepository extends Repository<MoocletExperimentRef> {}
