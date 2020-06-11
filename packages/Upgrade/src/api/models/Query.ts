import { Entity, ManyToOne, Column, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Metric } from './Metric';
import { Experiment } from './Experiment';
import { IsDefined } from 'class-validator';

@Entity()
export class Query extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsDefined()
  @Column('text')
  public name: string;

  @Column('jsonb')
  public query: any;

  @ManyToOne((type) => Metric, (metric) => metric.key)
  public metric: Metric;

  @ManyToOne((type) => Experiment, (experiment) => experiment.queries, { onDelete: 'CASCADE' })
  public experiment: Experiment;
}
