import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { ExperimentCondition } from './ExperimentCondition';
import { ExperimentSegment } from './ExperimentSegment';
import { BaseModel } from './base/BaseModel';

export enum CONSISTENCY_RULE {
  INDIVIDUAL = 'individual',
  EXPERIMENT = 'experiment',
  GROUP = 'group',
}

export enum ASSIGNMENT_UNIT {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

export enum POST_EXPERIMENT_RULE {
  CONTINUE = 'continue',
  REVERT_TO_DEFAULT = 'revertToDefault',
}

export enum EXPERIMENT_STATE {
  INACTIVE = 'inactive',
  DEMO = 'demo',
  SCHEDULED = 'scheduled',
  ENROLLING = 'enrolling',
  ENROLLMENT_COMPLETE = 'enrollmentComplete',
  CANCELLED = 'cancelled',
}

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

  @IsNotEmpty()
  @Column({
    name: 'consistency_rule',
    type: 'enum',
    enum: CONSISTENCY_RULE,
  })
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  @Column({
    name: 'assignment_unit',
    type: 'enum',
    enum: ASSIGNMENT_UNIT,
  })
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @Column({
    name: 'post_experiment_rule',
    type: 'enum',
    enum: POST_EXPERIMENT_RULE,
  })
  public postExperimentRule: POST_EXPERIMENT_RULE;

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
