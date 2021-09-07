import { Entity, ManyToOne, PrimaryColumn, Column, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { Experiment } from './Experiment';
import { ExperimentUser } from './ExperimentUser';
import { ASSIGNMENT_TYPE } from '../../types/index';

@Entity()
export class IndividualAssignment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Index()
  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @ManyToOne((type) => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;

  @Column({
    type: 'enum',
    enum: ASSIGNMENT_TYPE,
    default: ASSIGNMENT_TYPE.ALGORITHMIC,
  })
  public assignmentType: ASSIGNMENT_TYPE;
}
