import { Service } from 'typedi';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentAssignmentService } from './ExperimentAssignmentService';
import { IExperimentAssignment } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { ExperimentUserService } from './ExperimentUserService';

@Service()
export class SupportService {
  constructor(
    @Logger(__filename) private log: LoggerInterface,
    public experimentAssignmentService: ExperimentAssignmentService,
    public experimentUserService: ExperimentUserService
  ) {}

  public async getAssignments(userId: string, context: string): Promise<IExperimentAssignment[]> {
    this.log.info('Get all assignments');
    // getOriginalUserDoc
    let experimentUserDoc = await this.experimentUserService.getOriginalUserDoc(userId, new UpgradeLogger());
    return this.experimentAssignmentService.getAllExperimentConditions(
      userId,
      context,
      { logger: new UpgradeLogger(), userDoc: experimentUserDoc },
      false
    );
  }
}
