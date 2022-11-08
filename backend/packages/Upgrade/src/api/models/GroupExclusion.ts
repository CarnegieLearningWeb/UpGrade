import { EXCLUSION_CODE } from 'upgrade_types';
import { IsNotEmpty } from 'class-validator';
import { PrimaryColumn, Entity, ManyToOne, Column, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class GroupExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @IsNotEmpty()
  @Column({ type: 'enum', enum: EXCLUSION_CODE, nullable: true })
  public exclusionCode: EXCLUSION_CODE;

  @Column()
  public groupId: string;
}
