import { PrimaryColumn, ManyToOne, Entity } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';

@Entity()
export class GroupAssignment extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
