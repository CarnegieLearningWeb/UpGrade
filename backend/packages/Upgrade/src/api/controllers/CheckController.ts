import { JsonController, Get, Post, Body } from 'routing-controllers';
import { CheckService } from '../services/CheckService';
import { DiscriminatorDTO } from '../DTO/DiscriminatorDTO';

// TODO delete this after completing
@JsonController('/check')
export class Demo {
  constructor(public check: CheckService) {}
  @Get('/groupAssignment')
  public groupAssignment(): Promise<any> {
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

  @Post('/moocklet')
  public moocletTest(@Body({ validate: true }) body: DiscriminatorDTO): Promise<any> {
    console.log('Reaching here', body);
    return Promise.resolve({});
  }
}
