import { Authorized, JsonController, Get, Post, Body } from 'routing-controllers';
import { QueryService } from '../services/QueryService';
import { Query } from '../models/Query';
import { QueryValidator } from './validators/QueryValidator';

@Authorized()
@JsonController('/query')
export class QueryController {
  constructor(public queryService: QueryService) {}

  @Get()
  public async getAllQuery(): Promise<Query[]> {
    return this.queryService.find();
  }

  @Post()
  public async saveQuery(
    @Body({ validate: { validationError: { target: true, value: true } } })
    queryValidator: QueryValidator
  ): Promise<Query> {
    return this.queryService.saveQuery(queryValidator.query, queryValidator.metric);
  }
}
