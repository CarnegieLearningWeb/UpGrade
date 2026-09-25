import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Index } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';

@Entity()
@Index(['conditionId'])
export class ThompsonSamplingReward extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

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
