import { ExplicitIndividualAssignment } from '../models/ExplicitIndividualAssignment';
import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';

@EntityRepository(ExplicitIndividualAssignment)
export class ExplicitIndividualAssignmentRepository extends Repository<ExplicitIndividualAssignment> {}
