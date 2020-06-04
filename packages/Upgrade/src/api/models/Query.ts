import { Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, Column, JoinTable } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Metric } from './Metric';
import { Experiment } from './Experiment';

@Entity()
export class Query extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column('jsonb')
  public query: any;

  @ManyToOne((type) => Metric)
  public metric: Metric;

  @ManyToMany((type) => Experiment, (experiment) => experiment.queries)
  @JoinTable({
    name: 'query_experiments',
  })
  public experiments: Experiment[];
}
