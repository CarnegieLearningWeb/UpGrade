import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Metric } from './Metric';
import { Experiment } from './Experiment';

@Entity()
export class Query extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column('jsonb')
  public query: any;

  @ManyToOne((type) => Metric, (metric) => metric.key)
  public metric: Metric;

  @ManyToOne((type) => Experiment, (experiment) => experiment.queries)
  public experiment: Experiment;
}
