import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';

@Entity()
export class IndividualAssignment extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
