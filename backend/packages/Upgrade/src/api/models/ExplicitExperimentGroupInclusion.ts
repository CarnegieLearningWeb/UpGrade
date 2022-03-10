import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class ExplicitExperimentGroupInclusion extends BaseModel {
  @Column({ primary: true })
  public groupId: string;

  @Column({ primary: true })
  public type: string;

  @ManyToOne((type) => Experiment, (experiment) => experiment.explicitExperimentGroupInclusion, { onDelete: 'CASCADE', primary: true })
  public experiment: Experiment;
}
