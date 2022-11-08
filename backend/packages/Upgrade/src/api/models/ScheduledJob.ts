import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

export enum SCHEDULE_TYPE {
  START_EXPERIMENT = 'start experiment',
  END_EXPERIMENT = 'end experiment',
}

@Entity()
export class ScheduledJob extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column()
  public type: SCHEDULE_TYPE;

  @Column()
  public timeStamp: Date;

  @Column()
  public executionArn: string;
}
