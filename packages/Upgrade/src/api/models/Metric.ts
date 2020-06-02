import { BaseModel } from './base/BaseModel';
import { Entity, PrimaryColumn, ManyToMany, JoinTable } from 'typeorm';
import { Log } from './Log';

@Entity()
export class Metric extends BaseModel {
  @PrimaryColumn()
  public key: string;

  @ManyToMany((type) => Log, (log) => log.metrics, {
    cascade: true,
  })
  @JoinTable({
    name: 'metric_log',
  })
  public logs: Log[];
}
