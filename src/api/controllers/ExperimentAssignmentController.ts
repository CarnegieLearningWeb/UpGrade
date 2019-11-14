import { JsonController, Post, BodyParam, Put } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { EXPERIMENT_STATE } from '../models/Experiment';

@JsonController('/')
export class ExperimentConditionController {
  constructor(
    public experimentService: ExperimentService,
    public experimentAssignmentService: ExperimentAssignmentService
  ) {}

  @Post('mark')
  public markExperimentPoint(
    @BodyParam('experimentId') experimentId: string,
    @BodyParam('experimentPoint') experimentPoint: string,
    @BodyParam('userId') userId: string,
    @BodyParam('userEnvironment') userEnvironment: object
  ): any {
    return this.experimentAssignmentService.markExperimentPoint(
      experimentId,
      experimentPoint,
      userId,
      userEnvironment
    );
  }

  @Post('assign')
  public getAllExperimentConditions(
    @BodyParam('userId') userId: string,
    @BodyParam('userEnvironment') userEnvironment: any
  ): any {
    return this.experimentAssignmentService.getAllExperimentConditions(
      userId,
      userEnvironment
    );
  }

  @Put('state')
  public updateState(
    @BodyParam('experimentId') experimentId: string,
    @BodyParam('state') state: EXPERIMENT_STATE
  ): any {
    return this.experimentAssignmentService.updateState(experimentId, state);
  }
}
