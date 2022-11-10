import { Entity, ManyToOne, Column, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Metric } from './Metric';
import { Experiment } from './Experiment';
import { IsDefined } from 'class-validator';
import { REPEATED_MEASURE } from 'upgrade_types';

@Entity()
export class Query extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsDefined()
  @Column('text')
  public name: string;

  @Column('jsonb')
  public query: any;

  @ManyToOne(() => Metric, (metric) => metric.key, { onDelete: 'CASCADE' })
  public metric: Metric;

  @ManyToOne(() => Experiment, (experiment) => experiment.queries, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column({
    type: 'enum',
    enum: REPEATED_MEASURE,
    default: REPEATED_MEASURE.mostRecent,
  })
  public repeatedMeasure: REPEATED_MEASURE;
}
