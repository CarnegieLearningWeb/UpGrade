import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';
import { EXPERIMENT_STATE } from 'upgrade_types';

@Entity()
export class StateTimeLog extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column({
    type: 'enum',
    enum: EXPERIMENT_STATE,
  })
  public fromState: EXPERIMENT_STATE;

  @Column({
    type: 'enum',
    enum: EXPERIMENT_STATE,
  })
  public toState: EXPERIMENT_STATE;

  @Column()
  public timeLog: Date;

  @ManyToOne(() => Experiment, (experiment) => experiment.stateTimeLogs, { onDelete: 'CASCADE' })
  public experiment: Experiment;
}
