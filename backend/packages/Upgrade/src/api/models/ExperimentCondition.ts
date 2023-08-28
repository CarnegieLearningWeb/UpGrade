import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { IsNotEmpty, IsNumber, IsAlphanumeric } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';
import { ConditionPayload } from './ConditionPayload';
import { LevelCombinationElement } from './LevelCombinationElement';

@Entity()
export class ExperimentCondition extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column('char', { length: '2', unique: false })
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

  @Column({ nullable: true })
  public conditionCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Column({ type: 'real' })
  public assignmentWeight: number;

  @IsNotEmpty()
  @IsNumber()
  @Column({
    nullable: true,
  })
  public order: number;

  @ManyToOne(() => Experiment, (experiment) => experiment.conditions, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @OneToMany(() => ConditionPayload, (conditionPayload) => conditionPayload.parentCondition)
  public conditionPayloads: ConditionPayload[];

  @OneToMany(() => LevelCombinationElement, (levelCombinationElement) => levelCombinationElement.condition)
  public levelCombinationElements?: LevelCombinationElement[];
}
