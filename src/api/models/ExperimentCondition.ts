import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Experiment } from './Experiment';

@Entity()
export class ExperimentCondition {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column()
  public description: string;

  @IsNotEmpty()
  @Column({
    name: 'assignment_weight',
    type: 'decimal',
  })
  public assignmentWeight: number;

  @ManyToOne(type => Experiment, experiment => experiment.conditions)
  public experiment: Experiment;
}
