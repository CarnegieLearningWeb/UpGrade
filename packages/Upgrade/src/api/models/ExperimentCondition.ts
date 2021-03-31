import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty, IsNumber, IsAlphanumeric } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExperimentCondition extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column('char', { length: '2', unique: true })
  @IsAlphanumeric()
  @IsNotEmpty()
  public twoCharacterId: string;

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
  @IsNumber()
  @Column()
  public assignmentWeight: number;

  @ManyToOne((type) => Experiment, (experiment) => experiment.conditions, { onDelete: 'CASCADE' })
  public experiment: Experiment;
}
