import { EntityRepository } from 'typeorm';
import { IndividualAssignment } from '../models/IndividualAssignment';

import { BaseIndividualAssignmentRepository } from './base/BaseIndividualAssignmentRepository';

@EntityRepository(IndividualAssignment)
export class IndividualAssignmentRepository extends BaseIndividualAssignmentRepository<IndividualAssignment> {
  constructor() {
    super(IndividualAssignment);
  }
}
