import { Service } from 'typedi';
import { ExperimentAssignmentService } from './ExperimentAssignmentService';
import { IExperimentAssignment } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { ExperimentUserService } from './ExperimentUserService';

@Service()
export class SupportService {
  constructor(
    public experimentAssignmentService: ExperimentAssignmentService,
    public experimentUserService: ExperimentUserService
  ) {}

  public async getAssignments(userId: string, context: string, logger: UpgradeLogger): Promise<IExperimentAssignment[]> {
    if (logger) {
      logger.info({ message: 'Get all assignments' });
    }
    // getOriginalUserDoc
    let experimentUserDoc = await this.experimentUserService.getOriginalUserDoc(userId, logger);
    return this.experimentAssignmentService.getAllExperimentConditions(
      userId,
      context,
      { logger: new UpgradeLogger(), userDoc: experimentUserDoc },
      false
    );
  }
}
