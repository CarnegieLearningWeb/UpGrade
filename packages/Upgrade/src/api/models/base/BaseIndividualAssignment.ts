import { PrimaryColumn, ManyToOne } from 'typeorm';
import { ExperimentCondition } from '../ExperimentCondition';
import { BaseModel } from './BaseModel';

export class BaseIndividualAssignment extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
