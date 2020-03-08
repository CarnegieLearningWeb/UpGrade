import { EntityRepository } from 'typeorm';
import { PreviewGroupAssignment } from '../models/PreviewGroupAssignment';
import { BaseGroupAssignmentRepository } from './base/BaseGroupAssignmentRepository';

@EntityRepository(PreviewGroupAssignment)
export class PreviewGroupAssignmentRepository extends BaseGroupAssignmentRepository<PreviewGroupAssignment> {
  constructor() {
    super(PreviewGroupAssignment);
  }
}
