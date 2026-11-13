import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ThompsonSamplingExperimentConfig extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @OneToOne(() => Experiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experimentId' })
  experiment: Experiment;

  @Column({ nullable: true })
  experimentId?: string;

  /** Use uniform random selection until total reward observations exceed this count. */
  @Column({ default: 0 })
  warmupThreshold: number;

  /** Fall back to uniform when the top two sampled draws differ by less than this value. */
  @Column({ type: 'float', default: 0 })
  minimumDrawDifference: number;

  /** Update posteriors every N reward events rather than on every reward. */
  @Column({ default: 1 })
  batchSize: number;

  /**
   * Multiplier (α) on every condition's success/failure counts before they're added to its prior:
   * Beta(priorSuccess + α·successCount, priorFailure + α·failureCount). Counts are stored raw and α
   * is applied at draw time, so editing it re-weights all rewards received so far. 1 = no scaling.
   */
  @Column({ type: 'float', default: 1 })
  scalingFactor: number;

  /** Populated by config repository joins through the experiment's conditions. */
  conditionPosteriorStates: import('./ConditionPosteriorState').ConditionPosteriorState[];
}
