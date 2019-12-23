import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, IsDate } from 'class-validator';
import { ExperimentCondition } from './ExperimentCondition';
import { ExperimentSegment } from './ExperimentSegment';
import { BaseModel } from './base/BaseModel';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  IEnrollmentCompleteCondition,
} from 'ees_types';
@Entity()
export class Experiment extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column()
  public description: string;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: EXPERIMENT_STATE,
    default: EXPERIMENT_STATE.INACTIVE,
  })
  public state: EXPERIMENT_STATE;

  // TODO add conditional validity here ie EXPERIMENT_STATE is scheduled
  @IsDate()
  @Column({ nullable: true })
  public startOn: Date;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: CONSISTENCY_RULE,
  })
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: ASSIGNMENT_UNIT,
  })
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: POST_EXPERIMENT_RULE,
  })
  public postExperimentRule: POST_EXPERIMENT_RULE;

  // TODO add conditional validity here ie endOn is null
  @Column({ nullable: true, type: 'json' })
  public enrollmentCompleteCondition: Partial<IEnrollmentCompleteCondition>;

  // TODO add conditional validity here ie enrollmentCompleteCondition is null
  @IsDate()
  @Column({ nullable: true })
  public endOn: Date;

  @Column({ nullable: true, type: 'uuid' })
  public revertTo: string;

  @Column('text', { array: true, nullable: true })
  public tags: string[];

  @Column('text', { nullable: true })
  public group: string;

  @OneToMany(
    type => ExperimentCondition,
    condition => condition.experiment
  )
  public conditions: ExperimentCondition[];

  @OneToMany(
    type => ExperimentSegment,
    segment => segment.experiment
  )
  public segments: ExperimentSegment[];
}
