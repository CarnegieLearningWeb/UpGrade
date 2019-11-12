import { JsonController, Post, BodyParam, Get } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';

@JsonController('/assign')
export class ExperimentConditionController {
  constructor(
    public experimentService: ExperimentService,
    public experimentAssignmentService: ExperimentAssignmentService
  ) {}

  @Post()
  public markExperimentPoint(
    @BodyParam('experimentId') experimentId: string,
    @BodyParam('experimentPoint') experimentPoint: string,
    @BodyParam('userId') userId: string,
    @BodyParam('userEnvironment') userEnvironment: object
  ): any {
    return this.experimentAssignmentService.markExperimentPoint(experimentId, experimentPoint, userId, userEnvironment);
  }

  // TODO - only for checking
  @Get()
  public check(): Promise<any> {
    return this.experimentAssignmentService.check();
  }
}
