import { ExperimentPartition } from './ExperimentPartition';
import { Entity, ManyToOne, PrimaryColumn, Column, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class IndividualEnrollment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Index()
  @ManyToOne((type) => ExperimentPartition, { onDelete: 'CASCADE' })
  public partition: ExperimentPartition;

  @Index()
  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @Column({ nullable: true })
  public groupId?: string;

  @ManyToOne((type) => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;
}
