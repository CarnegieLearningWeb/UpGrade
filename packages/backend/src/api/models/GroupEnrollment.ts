import { PrimaryColumn, ManyToOne, Entity, Column, Index } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { DecisionPoint } from './DecisionPoint';

@Entity()
export class GroupEnrollment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column({ name: 'experimentId', nullable: true })
  experimentId?: string;

  @Index()
  @ManyToOne(() => DecisionPoint, { onDelete: 'CASCADE' })
  public partition: DecisionPoint;

  @Column()
  public groupId: string;

  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;

  @Column({ name: 'conditionId', nullable: true })
  conditionId?: string;
}
