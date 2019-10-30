import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Experiment } from './Experiment';
import { ExperimentSegmentCondition } from './ExperimentSegmentCondition';

@Entity()
export class ExperimentSegment {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column()
  public description: string;

  @ManyToOne(type => Experiment, experiment => experiment.segments)
  public experiment: Experiment;

  @OneToMany(type => ExperimentSegmentCondition, condition => condition.experimentSegment, { cascade: true })
  public segmentConditions: ExperimentSegmentCondition[];
}
