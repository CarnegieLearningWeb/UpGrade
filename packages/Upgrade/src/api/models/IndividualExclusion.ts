import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class IndividualExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;
}
