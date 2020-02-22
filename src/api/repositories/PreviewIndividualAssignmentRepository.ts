import { EntityRepository } from 'typeorm';
import { PreviewIndividualAssignment } from '../models/PreviewIndividualAssignment';
import { BaseIndividualAssignmentRepository } from './base/BaseIndividualAssignmentRepository';

@EntityRepository(PreviewIndividualAssignment)
export class PreviewIndividualAssignmentRepository extends BaseIndividualAssignmentRepository<
  PreviewIndividualAssignment
> {
  constructor() {
    super(PreviewIndividualAssignment);
  }
}
