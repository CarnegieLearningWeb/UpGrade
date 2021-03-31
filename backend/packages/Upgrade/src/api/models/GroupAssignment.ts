import { PrimaryColumn, ManyToOne, Entity, Column } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class GroupAssignment extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column()
  public groupId: string;

  @ManyToOne((type) => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;
}
