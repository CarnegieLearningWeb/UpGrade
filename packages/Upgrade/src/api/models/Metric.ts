import { BaseModel } from './base/BaseModel';
import { Entity, PrimaryColumn, ManyToMany, JoinTable, Column } from 'typeorm';
import { Log } from './Log';
import { IMetricMetaData } from 'upgrade_types';

@Entity()
export class Metric extends BaseModel {
  @PrimaryColumn()
  public key: string;

  @Column({
    type: 'enum',
    enum: IMetricMetaData,
    default: IMetricMetaData.CONTINUOUS,
  })
  public type: IMetricMetaData;

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
