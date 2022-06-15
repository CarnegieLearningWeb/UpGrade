import { Column, Entity, PrimaryColumn, OneToMany, OneToOne } from 'typeorm';
import { IsNotEmpty, ValidateNested, ValidateIf } from 'class-validator';
import { ExperimentCondition } from './ExperimentCondition';
import { DecisionPoint } from './DecisionPoint';
import { BaseModel } from './base/BaseModel';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_SORT_AS,
  FILTER_MODE,
  IEnrollmentCompleteCondition,
  IExperimentSearchParams,
  IExperimentSortParams,
} from 'upgrade_types';
import { Type } from 'class-transformer';
import { Query } from './Query';
import { StateTimeLog } from './StateTimeLogs';
import { ExplicitExperimentGroupExclusion } from './ExplicitExperimentGroupExclusion';
import { ExplicitExperimentGroupInclusion } from './ExplicitExperimentGroupInclusion';
import { ExplicitExperimentIndividualExclusion } from './ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentIndividualInclusion } from './ExplicitExperimentIndividualInclusion';
import { ExperimentSegmentInclusion } from './ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from './ExperimentSegmentExclusion';

export {
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  IExperimentSearchParams,
  IExperimentSortParams,
};

@Entity()
export class Experiment extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column()
  public description: string;

  @Column('text', { array: true })
  public context: string[];

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: EXPERIMENT_STATE,
    default: EXPERIMENT_STATE.INACTIVE,
  })
  public state: EXPERIMENT_STATE;

  @Column({ nullable: true })
  @ValidateIf((o) => o.state === EXPERIMENT_STATE.SCHEDULED)
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

  @Column({
    default: false,
  })
  public logging: boolean;

  @Column({
    type: 'enum',
    enum: FILTER_MODE,
    default: FILTER_MODE.INCLUDE_ALL,
  })
  public filterMode: FILTER_MODE;

  @OneToMany((type) => ExperimentCondition, (condition) => condition.experiment)
  @ValidateNested()
  @Type(() => ExperimentCondition)
  public conditions: ExperimentCondition[];

  @OneToMany((type) => DecisionPoint, (partition) => partition.experiment)
  @ValidateNested()
  @Type(() => DecisionPoint)
  public partitions: DecisionPoint[];

  @OneToMany((type) => Query, (query) => query.experiment)
  public queries: Query[];

  @OneToMany((type) => StateTimeLog, (state) => state.experiment)
  @Type(() => StateTimeLog)
  public stateTimeLogs: StateTimeLog[];

  @OneToMany(
    (type) => ExplicitExperimentGroupExclusion,
    (explicitExperimentGroupExclusion) => explicitExperimentGroupExclusion.experiment
  )
  @Type(() => ExplicitExperimentGroupExclusion)
  public explicitExperimentGroupExclusion: ExplicitExperimentGroupExclusion[];

  @OneToMany(
    (type) => ExplicitExperimentGroupInclusion,
    (explicitExperimentGroupInclusion) => explicitExperimentGroupInclusion.experiment
  )
  @Type(() => ExplicitExperimentGroupInclusion)
  public explicitExperimentGroupInclusion: ExplicitExperimentGroupInclusion[];

  @OneToMany(
    (type) => ExplicitExperimentIndividualExclusion,
    (explicitExperimentIndividualExclusion) => explicitExperimentIndividualExclusion.experiment
  )
  @Type(() => ExplicitExperimentIndividualExclusion)
  public explicitExperimentIndividualExclusion: ExplicitExperimentIndividualExclusion[];

  @OneToMany(
    (type) => ExplicitExperimentIndividualInclusion,
    (explicitExperimentIndividualInclusion) => explicitExperimentIndividualInclusion.experiment
  )
  @Type(() => ExplicitExperimentIndividualInclusion)
  public explicitExperimentIndividualInclusion: ExplicitExperimentIndividualInclusion[];

  @OneToOne((type) => ExperimentSegmentInclusion, (experimentSegmentInclusion) => experimentSegmentInclusion.experiment)
  @Type(() => ExperimentSegmentInclusion)
  public experimentSegmentInclusion: ExperimentSegmentInclusion;

  @OneToOne((type) => ExperimentSegmentExclusion, (experimentSegmentExclusion) => experimentSegmentExclusion.experiment)
  @Type(() => ExperimentSegmentExclusion)
  public experimentSegmentExclusion: ExperimentSegmentExclusion;
  @Column({ default: '1.0.0' })
  public backendVersion: string;
}
