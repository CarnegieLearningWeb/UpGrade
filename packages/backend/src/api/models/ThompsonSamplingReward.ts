import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Index } from 'typeorm';
import { Experiment } from './Experiment';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';

@Entity()
@Index(['experimentId', 'conditionId'])
export class ThompsonSamplingReward extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experimentId' })
  experiment: Experiment;

  @Column()
  experimentId: string;

  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conditionId' })
  condition: ExperimentCondition;

  @Column()
  conditionId: string;

  @Column()
  userId: string;

  @Column({ type: 'boolean' })
  success: boolean;
}
