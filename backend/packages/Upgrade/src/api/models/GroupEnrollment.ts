import { PrimaryColumn, ManyToOne, Entity, Column, Index } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { ExperimentPartition } from './ExperimentPartition';

@Entity()
export class GroupEnrollment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Index()
  @ManyToOne((type) => ExperimentPartition, { onDelete: 'CASCADE' })
  public partition: ExperimentPartition;

  @Column()
  public groupId: string;

  @ManyToOne((type) => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;
}
