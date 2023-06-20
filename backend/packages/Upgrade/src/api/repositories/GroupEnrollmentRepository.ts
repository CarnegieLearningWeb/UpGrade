import { EntityRepository, In, Repository } from 'typeorm';
import { GroupEnrollment } from '../models/GroupEnrollment';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { DecisionPoint } from '../models/DecisionPoint';
import { MonitoredDecisionPointLog } from '../models/MonitoredDecisionPointLog';
import { ExperimentCondition } from '../models/ExperimentCondition';

@EntityRepository(GroupEnrollment)
export class GroupEnrollmentRepository extends Repository<GroupEnrollment> {
  public findEnrollments(groupIds: string[], experimentIds: string[]): Promise<GroupEnrollment[]> {
    return this.find({
      where: { experiment: { id: In(experimentIds) }, groupId: In(groupIds) },
      relations: ['experiment', 'condition'],
    });
  }
}
