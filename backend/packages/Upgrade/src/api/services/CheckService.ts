import { GroupEnrollment } from './../models/GroupEnrollment';
import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusion } from '../models/GroupExclusion';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { GroupEnrollmentRepository } from '../repositories/GroupEnrollmentRepository';
import { IndividualEnrollmentRepository } from '../repositories/IndividualEnrollmentRepository';
import { IndividualEnrollment } from '../models/IndividualEnrollment';

@Service()
export class CheckService {
  constructor(
    @InjectRepository()
    private groupEnrollmentRepository: GroupEnrollmentRepository,
    @InjectRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    @InjectRepository()
    private groupExclusionRepository: GroupExclusionRepository,
    @InjectRepository()
    private individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository()
    private monitoredExperimentPointRepository: MonitoredDecisionPointRepository
  ) {}

  public getAllGroupAssignments(): Promise<GroupEnrollment[]> {
    return this.groupEnrollmentRepository.find({ relations: ['condition'] });
  }

  public getAllIndividualAssignment(): Promise<IndividualEnrollment[]> {
    return this.individualEnrollmentRepository.find({
      relations: ['experiment', 'user', 'condition'],
    });
  }

  public getAllGroupExclusions(): Promise<GroupExclusion[]> {
    return this.groupExclusionRepository.find();
  }

  public getAllIndividualExclusion(): Promise<IndividualExclusion[]> {
    return this.individualExclusionRepository.find();
  }

  public getAllMarkedExperimentPoints(): Promise<MonitoredDecisionPoint[]> {
    return this.monitoredExperimentPointRepository.find({ relations: ['user', 'monitoredPointLogs'] });
  }
}
