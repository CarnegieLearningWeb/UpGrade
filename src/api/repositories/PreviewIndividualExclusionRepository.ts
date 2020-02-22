import { EntityRepository } from 'typeorm';
import { PreviewIndividualExclusion } from '../models/PreviewIndividualExclusion';
import { BaseIndividualExclusionRepository } from './base/BaseIndividualExclusionRepository';

@EntityRepository(PreviewIndividualExclusion)
export class PreviewIndividualExclusionRepository extends BaseIndividualExclusionRepository<
  PreviewIndividualExclusion
> {
  constructor() {
    super(PreviewIndividualExclusion);
  }
}
