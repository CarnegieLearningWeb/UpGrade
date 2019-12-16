import { JsonController, Post, BodyParam, Get } from 'routing-controllers';
import { ExcludeService } from '../services/ExcludeService';
import { ExplicitIndividualExclusion } from '../models/ExplicitIndividualExclusion';
import { ExplicitGroupExclusion } from '../models/ExplicitGroupExclusion';

@JsonController('/exclude')
export class ExcludeController {
  constructor(public exclude: ExcludeService) {}

  @Get('/user')
  public getAllUser(): Promise<ExplicitIndividualExclusion[]> {
    return this.exclude.getAllUser();
  }

  @Get('/group')
  public getAllGroup(): Promise<ExplicitGroupExclusion[]> {
    return this.exclude.getAllGroups();
  }

  @Post('/user')
  public excludeUser(@BodyParam('id') id: string): Promise<ExplicitIndividualExclusion> {
    return this.exclude.excludeUser(id);
  }

  @Post('/group')
  public excludeGroup(@BodyParam('type') type: string, @BodyParam('id') id: string): Promise<ExplicitGroupExclusion> {
    return this.exclude.excludeGroup(id, type);
  }
}
