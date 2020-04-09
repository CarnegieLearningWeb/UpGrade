import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';

import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';

@Entity()
export class IndividualAssignment extends BaseModel {
  // TODO convert this to foreign key
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
