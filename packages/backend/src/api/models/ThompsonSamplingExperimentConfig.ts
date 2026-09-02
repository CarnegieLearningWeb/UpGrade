import { Entity, Column, OneToMany, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm';
import { ConditionPosteriorState } from './ConditionPosteriorState';
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
  @Column({ nullable: true })
  warmupThreshold?: number;

  /** Fall back to uniform when the top two sampled draws differ by less than this value. */
  @Column({ nullable: true, type: 'float' })
  minimumDrawDifference?: number;

  /** Update posteriors every N reward events rather than on every reward. */
  @Column({ nullable: true })
  batchSize?: number;

  @OneToMany(() => ConditionPosteriorState, (state) => state.config, {
    cascade: true,
  })
  conditionPosteriorStates: ConditionPosteriorState[];
}
