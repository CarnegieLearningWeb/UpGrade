import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExperimentCondition extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column({
    nullable: true,
  })
  public name: string;

  @Column({
    nullable: true,
  })
  public description: string;

  @Column()
  public conditionCode: string;

  @IsNotEmpty()
  @Column({
    type: 'decimal',
  })
  public assignmentWeight: number;

  @ManyToOne(
    type => Experiment,
    experiment => experiment.conditions
  )
  public experiment: Experiment;
}
