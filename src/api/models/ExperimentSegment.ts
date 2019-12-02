import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Experiment } from './Experiment';

@Entity()
export class ExperimentSegment {
  @PrimaryColumn()
  public id: string;

  @PrimaryColumn()
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
