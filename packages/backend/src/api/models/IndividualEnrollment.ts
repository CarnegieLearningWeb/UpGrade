import { IsNotEmpty } from 'class-validator';
import { ENROLLMENT_CODE } from 'upgrade_types';
import { DecisionPoint } from './DecisionPoint';
import { Entity, ManyToOne, PrimaryColumn, Column, Index, OneToMany } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';
import { RepeatedEnrollment } from './RepeatedEnrollment';

@Entity()
export class IndividualEnrollment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column({ name: 'experimentId', nullable: true })
  experimentId?: string;

  @Index()
  @ManyToOne(() => DecisionPoint, { onDelete: 'CASCADE' })
  public partition: DecisionPoint;

  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @Column({ name: 'userId', nullable: true })
  userId?: string;

  @Column({ nullable: true })
  public groupId?: string;

  @IsNotEmpty()
  @Column({ type: 'enum', enum: ENROLLMENT_CODE, nullable: true })
  public enrollmentCode: ENROLLMENT_CODE;

  @Index()
  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;

  @Column({ name: 'conditionId', nullable: true })
  public conditionId?: string;

  @OneToMany(() => RepeatedEnrollment, (repeatedEnrollment) => repeatedEnrollment.individualEnrollment)
  public repeatedEnrollments?: RepeatedEnrollment[];
}
