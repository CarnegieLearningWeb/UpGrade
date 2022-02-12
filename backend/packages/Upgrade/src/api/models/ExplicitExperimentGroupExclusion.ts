import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class ExplicitExperimentGroupExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column()
  public groupId: string;

  @Column()
  public type: string;

  @ManyToOne((type) => Experiment, (experiment) => experiment.explicitExperimentGroupExclusion, { onDelete: 'CASCADE', primary: true })
  public experiment: Experiment;
}
