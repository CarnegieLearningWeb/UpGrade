import { EntityRepository } from 'typeorm';
import { PreviewGroupExclusion } from '../models/PreviewGroupExclusion';
import { BaseGroupExclusionRepository } from './base/BaseGroupExclusionRepository';

@EntityRepository(PreviewGroupExclusion)
export class PreviewGroupExclusionRepository extends BaseGroupExclusionRepository<PreviewGroupExclusion> {
  constructor() {
    super(PreviewGroupExclusion);
  }
}
