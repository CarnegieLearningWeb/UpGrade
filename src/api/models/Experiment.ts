import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { ExperimentCondition } from './ExperimentCondition';
import { ExperimentSegment } from './ExperimentSegment';

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
export class Experiment {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column()
  public description: string;

  @IsNotEmpty()
  @Column()
  public state: EXPERIMENT_STATE;

  @IsNotEmpty()
  @Column({
    name: 'consistency_rule',
  })
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  @Column({
    name: 'assignment_unit',
  })
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @Column({
    name: 'post_experiment_rule',
  })
  public postExperimentRule: POST_EXPERIMENT_RULE;

  @OneToMany(type => ExperimentCondition, condition => condition.experiment, { cascade: true })
  public conditions: ExperimentCondition[];

  @OneToMany(type => ExperimentSegment, segment => segment.experiment, { cascade: true })
  public segments: ExperimentSegment[];
}
