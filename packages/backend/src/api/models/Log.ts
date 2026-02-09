import { BaseModel } from './base/BaseModel';
import { Entity, Column, ManyToMany, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { Metric } from './Metric';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class Log extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ default: 1 })
  public uniquifier: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  public timeStamp: Date;

  @Column('jsonb')
  public data: any;

  @ManyToMany(() => Metric, (metric) => metric.logs)
  public metrics: Metric[];

  @Index()
  @ManyToOne(() => ExperimentUser, (user) => user.logs)
  public user: ExperimentUser;
}
