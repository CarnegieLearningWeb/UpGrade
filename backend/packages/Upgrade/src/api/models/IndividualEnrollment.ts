import { IsNotEmpty } from 'class-validator';
import { ENROLLMENT_CODE } from 'upgrade_types';
import { DecisionPoint } from './DecisionPoint';
import { Entity, ManyToOne, PrimaryColumn, Column, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class IndividualEnrollment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Index()
  @ManyToOne(() => DecisionPoint, { onDelete: 'CASCADE' })
  public partition: DecisionPoint;

  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @Column({ nullable: true })
  public groupId?: string;

  @IsNotEmpty()
  @Column({ type: 'enum', enum: ENROLLMENT_CODE, nullable: true })
  public enrollmentCode: ENROLLMENT_CODE;

  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;
}
