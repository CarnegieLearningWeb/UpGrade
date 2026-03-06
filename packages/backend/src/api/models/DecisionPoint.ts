import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { IsNotEmpty, IsAlphanumeric, IsNumber } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';
import { ConditionPayload } from './ConditionPayload';

@Entity()
export class DecisionPoint extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column('char', { length: '2', unique: false })
  @IsAlphanumeric()
  @IsNotEmpty()
  public twoCharacterId: string;

  @IsNotEmpty()
  @Column()
  public site: string;

  @Column({ nullable: true })
  public target: string;

  @Column()
  public description: string;

  @IsNotEmpty()
  @IsNumber()
  @Column({
    nullable: true,
  })
  public order: number;

  @Column({
    default: false,
  })
  public excludeIfReached: boolean;

  @ManyToOne(() => Experiment, (experiment) => experiment.partitions, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @OneToMany(() => ConditionPayload, (conditionPayload) => conditionPayload.decisionPoint)
  public conditionPayloads: ConditionPayload[];
}
