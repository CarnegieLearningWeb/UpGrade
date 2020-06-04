import { BaseModel } from './base/BaseModel';
import { Entity, PrimaryColumn, ManyToMany, JoinTable, Column } from 'typeorm';
import { Log } from './Log';

export enum METRIC_TYPE {
  CONTINUOUS = 'continuous',
  CATEGORICAL = 'categorical',
}

@Entity()
export class Metric extends BaseModel {
  @PrimaryColumn()
  public key: string;

  @Column({
    type: 'enum',
    enum: METRIC_TYPE,
    default: METRIC_TYPE.CONTINUOUS,
  })
  public type: METRIC_TYPE;

  @Column({ type: 'simple-array', nullable: true })
  public allowedData: string[];

  @ManyToMany((type) => Log, (log) => log.metrics, {
    cascade: true,
  })
  @JoinTable({
    name: 'metric_log',
  })
  public logs: Log[];
}
