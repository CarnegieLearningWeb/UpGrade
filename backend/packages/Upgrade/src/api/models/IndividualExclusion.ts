import { EXCLUSION_CODE } from 'upgrade_types';
import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryColumn, ManyToOne, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class IndividualExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @IsNotEmpty()
  @Column({ type: 'enum', enum: EXCLUSION_CODE, nullable: true })
  public exclusionCode: EXCLUSION_CODE;

  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;
}
