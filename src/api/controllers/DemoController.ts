import { JsonController, Post, Body } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';

@JsonController('/experimentCondition')
export class Demo {
  constructor(public experimentService: ExperimentService) {}
  @Post()
  public create(@Body() experiment: any): string {
    return this.experimentService.getExperimentAssignment(experiment);
  }
}
