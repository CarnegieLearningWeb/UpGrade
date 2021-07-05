import { PrimaryColumn, ManyToOne, Entity, Column, Index } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class GroupAssignment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column()
  public groupId: string;

  @ManyToOne((type) => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;
}
