import { BaseModel } from './base/BaseModel';
import { Entity, PrimaryColumn, ManyToMany, JoinTable, Column, OneToMany } from 'typeorm';
import { Log } from './Log';
import { IMetricMetaData } from 'upgrade_types';
import { Query } from './Query';

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

  @ManyToMany(() => Log, (log) => log.metrics, {
    cascade: true,
  })
  @JoinTable({
    name: 'metric_log',
  })
  public logs: Log[];

  @OneToMany(() => Query, (query) => query.metric)
  public queries: Query[];
}
