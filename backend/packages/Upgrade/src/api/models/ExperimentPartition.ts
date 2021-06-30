import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty, IsAlphanumeric, IsNumber } from 'class-validator';
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
  public expPoint: string;

  @Column({ nullable: true })
  public expId: string | undefined;

  @Column()
  public description: string;

  @IsNotEmpty()
  @IsNumber()
  @Column()
  public order: number;

  @ManyToOne((type) => Experiment, (experiment) => experiment.partitions, { onDelete: 'CASCADE' })
  public experiment: Experiment;
}

export function getExperimentPartitionID(partitionPoint: string, partitionId: string): string {
  return partitionId ? `${partitionId}_${partitionPoint}` : `${partitionPoint}`;
}
