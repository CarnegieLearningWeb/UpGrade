import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty, IsAlphanumeric, IsNumber } from 'class-validator';
import { Experiment } from './Experiment';
import { BaseModel } from './base/BaseModel';

@Entity()
export class DecisionPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column('char', { length: '2', unique: true })
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

  @ManyToOne((type) => Experiment, (experiment) => experiment.partitions, { onDelete: 'CASCADE' })
  public experiment: Experiment;
}

export function getExperimentPartitionID(site: string, target: string): string {
  return target ? `${target}_${site}` : `${site}`;
}
