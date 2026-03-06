import { EXCLUSION_CODE } from 'upgrade_types';
import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryColumn, ManyToOne, Column, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class IndividualExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column({ name: 'experimentId', nullable: true })
  public experimentId?: string;

  @IsNotEmpty()
  @Column({ type: 'enum', enum: EXCLUSION_CODE, nullable: true })
  public exclusionCode: EXCLUSION_CODE;

  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @Column({ name: 'userId', nullable: true })
  public userId?: string;
}
