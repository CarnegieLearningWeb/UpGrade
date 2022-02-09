import { JsonController, Get, Req } from 'routing-controllers';
import { AppRequest } from '../../types';
import { CheckService } from '../services/CheckService';

// TODO delete this after completing
@JsonController('/check')
export class Demo {
  constructor(public check: CheckService) {}
  @Get('/groupAssignment')
  public groupAssignment(@Req() request: AppRequest): Promise<any> {
    return this.check.getAllGroupAssignments();
  }

  @Get('/individualAssignment')
  public individualAssignment(): Promise<any> {
    return this.check.getAllIndividualAssignment();
  }

  @Get('/individualExclusion')
  public individualExclusion(): Promise<any> {
    return this.check.getAllIndividualExclusion();
  }

  @Get('/groupExclusion')
  public groupExclusion(): Promise<any> {
    return this.check.getAllGroupExclusions();
  }

  @Get('/monitoredExperimentPoint')
  public monitoredExperimentPoint(): Promise<any> {
    return this.check.getAllMarkedExperimentPoints();
  }
}
