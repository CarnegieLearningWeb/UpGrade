import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ThompsonSamplingExperimentConfig } from './ThompsonSamplingExperimentConfig';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';

@Entity()
@Unique(['configId', 'conditionId'])
export class ConditionPosteriorState extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => ThompsonSamplingExperimentConfig, (config) => config.conditionPosteriorStates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configId' })
  config: ThompsonSamplingExperimentConfig;

  @Column()
  configId: string;

  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conditionId' })
  condition: ExperimentCondition;

  @Column()
  conditionId: string;

  /** α₀ — Beta prior success count for this condition. */
  @Column({ type: 'float', default: 1 })
  priorSuccess: number;

  /** β₀ — Beta prior failure count for this condition. */
  @Column({ type: 'float', default: 1 })
  priorFailure: number;

  /** Accumulated successes since the experiment started. */
  @Column({ type: 'int', default: 0 })
  successCount: number;

  /** Total rewards received for this condition (successes + failures). */
  @Column({ type: 'int', default: 0 })
  totalCount: number;
}
