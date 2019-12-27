import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExperimentSegment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @IsNotEmpty()
  @Column()
  public point: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column()
  public description: string;

  @ManyToOne(
    type => Experiment,
    experiment => experiment.segments
  )
  public experiment: Experiment;
}
