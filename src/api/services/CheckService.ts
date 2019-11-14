import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { GroupAssignmentRepository } from '../repositories/GroupAssignmentRepository';
import { IndividualAssignmentRepository } from '../repositories/IndividualAssignmentRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupAssignment } from '../models/GroupAssignment';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { GroupExclusion } from '../models/GroupExclusion';
import { IndividualExclusion } from '../models/IndividualExclusion';

@Service()
export class CheckService {
  constructor(
    @OrmRepository()
    private groupAssignmentRepository: GroupAssignmentRepository,
    @OrmRepository()
    private individualAssignmentRepository: IndividualAssignmentRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository()
    private individualExclusionRepository: IndividualExclusionRepository
  ) {}

  public getAllGroupAssignments(): Promise<GroupAssignment[]> {
    return this.groupAssignmentRepository.find({ relations: ['condition'] });
  }

  public getAllIndividualAssignment(): Promise<IndividualAssignment[]> {
    return this.individualAssignmentRepository.find({
      relations: ['condition'],
    });
  }

  public getAllGroupExclusions(): Promise<GroupExclusion[]> {
    return this.groupExclusionRepository.find();
  }

  public getAllIndividualExclusion(): Promise<IndividualExclusion[]> {
    return this.individualExclusionRepository.find();
  }
}
