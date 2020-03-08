import { EntityRepository } from 'typeorm';
import { GroupExclusion } from '../models/GroupExclusion';
import { BaseGroupExclusionRepository } from './base/BaseGroupExclusionRepository';

@EntityRepository(GroupExclusion)
export class GroupExclusionRepository extends BaseGroupExclusionRepository<GroupExclusion> {
  constructor() {
    super(GroupExclusion);
  }
}
