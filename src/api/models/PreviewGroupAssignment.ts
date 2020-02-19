import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';

@Entity()
export class PreviewGroupAssignment extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
