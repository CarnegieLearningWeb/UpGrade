import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class IndividualAssignment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @ManyToOne((type) => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;
}
