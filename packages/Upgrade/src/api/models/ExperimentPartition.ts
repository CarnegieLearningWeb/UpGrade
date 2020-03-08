import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty, IsAlphanumeric } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExperimentPartition extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column('char', { length: '2', unique: true })
  @IsAlphanumeric()
  @IsNotEmpty()
  public twoCharacterId: string;

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
    experiment => experiment.partitions
  )
  public experiment: Experiment;
}
