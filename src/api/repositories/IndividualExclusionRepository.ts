import { EntityRepository } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { BaseIndividualExclusionRepository } from './base/BaseIndividualExclusionRepository';

@EntityRepository(IndividualExclusion)
export class IndividualExclusionRepository extends BaseIndividualExclusionRepository<IndividualExclusion> {
  constructor() {
    super(IndividualExclusion);
  }
}
