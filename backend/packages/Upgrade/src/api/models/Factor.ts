import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { DecisionPoint } from './DecisionPoint';
import { Level } from './Level';
import { Experiment } from './Experiment';

@Entity()
export class Factor extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  public name: string;

  @Column({ nullable: true })
  @IsNumber()
  public order: number;

  @ManyToOne(() => Experiment, (experiment) => experiment.factors, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @OneToMany(() => Level, (level) => level.factor)
  public levels: Level[];
}
