import { PrimaryColumn, ManyToOne } from 'typeorm';
import { ExperimentCondition } from '../ExperimentCondition';
import { BaseModel } from './BaseModel';

export class BaseGroupAssignment extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
