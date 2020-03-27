import { ExplicitIndividualAssignment } from '../models/ExplicitIndividualAssignment';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExplicitIndividualAssignment)
export class ExplicitIndividualAssignmentRepository extends Repository<ExplicitIndividualAssignment> {}
