import { BaseModel } from './base/BaseModel';
import { Entity, PrimaryColumn, ManyToMany } from 'typeorm';
import { Experiment } from './Experiment';

@Entity()
export class Metric extends BaseModel {
  @PrimaryColumn()
  public key: string;

  @ManyToMany((type) => Experiment, (experiment) => experiment.metrics)
  public experiments: Experiment[];
}
