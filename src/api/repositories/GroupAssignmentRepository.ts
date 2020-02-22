import { EntityRepository } from 'typeorm';
import { GroupAssignment } from '../models/GroupAssignment';
import { BaseGroupAssignmentRepository } from './base/BaseGroupAssignmentRepository';

@EntityRepository(GroupAssignment)
export class GroupAssignmentRepository extends BaseGroupAssignmentRepository<GroupAssignment> {
  constructor() {
    super(GroupAssignment);
  }
}
