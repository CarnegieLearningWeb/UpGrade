import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, ValidateNested, ValidateIf } from 'class-validator';
import { ExperimentCondition } from './ExperimentCondition';
import { ExperimentPartition } from './ExperimentPartition';
import { BaseModel } from './base/BaseModel';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  IEnrollmentCompleteCondition,
} from 'ees_types';
import { Type } from 'class-transformer';

export enum SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  STATUS = 'status',
  TAG = 'tag',
}

export enum SORT_KEY {
  NAME = 'name',
  STATUS = 'state',
  CREATED_AT = 'createdAt',
  POST_EXPERIMENT_RULE = 'postExperimentRule',
}

export enum SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

export interface SearchParams {
  key: SEARCH_KEY;
  string: string;
}

export interface SortParams {
  key: SORT_KEY;
  sortAs: SORT_AS;
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

  @Column({ nullable: true })
  public context: string;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: EXPERIMENT_STATE,
    default: EXPERIMENT_STATE.INACTIVE,
  })
  public state: EXPERIMENT_STATE;

  // TODO add conditional validity here ie EXPERIMENT_STATE is scheduled
  @Column({ nullable: true })
  @ValidateIf(o => o.state === EXPERIMENT_STATE.SCHEDULED)
  @IsNotEmpty()
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
  @ValidateNested()
  @Type(() => ExperimentCondition)
  public conditions: ExperimentCondition[];

  @OneToMany(
    type => ExperimentPartition,
    partition => partition.experiment
  )
  @ValidateNested()
  @Type(() => ExperimentPartition)
  public partitions: ExperimentPartition[];
}
