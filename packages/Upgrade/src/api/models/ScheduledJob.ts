import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';

export enum SCHEDULE_TYPE {
  START_EXPERIMENT = 'start experiment',
  END_EXPERIMENT = 'end experiment',
}

@Entity()
export class ScheduledJob extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column()
  public experimentId: string;

  @Column()
  public type: SCHEDULE_TYPE;

  @Column()
  public timeStamp: Date;

  @Column()
  public executionArn: string;
}
