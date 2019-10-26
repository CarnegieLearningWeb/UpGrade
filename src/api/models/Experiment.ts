import { Column, Entity, PrimaryColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

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
}
