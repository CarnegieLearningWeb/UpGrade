import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class ExplicitExperimentIndividualInclusion extends BaseModel {
  @PrimaryColumn()
  public userId: string;

  @ManyToOne((type) => Experiment, (experiment) => experiment.explicitExperimentIndividualInclusion, { onDelete: 'CASCADE', primary: true })
  public experiment: Experiment;
}
