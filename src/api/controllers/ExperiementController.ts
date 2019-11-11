import { Body, Get, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers';
import { Experiment } from '../models/Experiment';
import { ExperimentNotFoundError } from '../errors/ExperimentNotFoundError';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentSegment } from '../models/ExperimentSegment';

@JsonController('/experiments')
export class ExperimentController {
  constructor(public experimentService: ExperimentService) {}
  @Get()
  public find(): Promise<Experiment[]> {
    return this.experimentService.find();
  }

  @Get('/:id')
  @OnUndefined(ExperimentNotFoundError)
  public one(@Param('id') id: string): Promise<Experiment> | undefined {
    return this.experimentService.findOne(id);
  }

  @Get('/conditions/:id/:point')
  @OnUndefined(ExperimentNotFoundError)
  public getCondition(@Param('id') id: string, @Param('point') point: string): Promise<ExperimentSegment> | undefined {
    return this.experimentService.getExperimentalConditions(id, point);
  }

  @Post()
  public create(@Body() experiment: Experiment): Promise<Experiment> {
    return this.experimentService.create(experiment);
  }

  @Put('/:id')
  public update(@Param('id') id: string, @Body() experiment: Experiment): Promise<Experiment> {
    return this.experimentService.update(id, experiment);
  }
}
