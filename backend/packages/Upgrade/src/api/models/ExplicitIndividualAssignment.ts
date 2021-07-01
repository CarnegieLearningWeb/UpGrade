import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { ExperimentCondition } from './ExperimentCondition';
import { PreviewUser } from './PreviewUser';

@Entity()
export class ExplicitIndividualAssignment extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @ManyToOne(
    type => PreviewUser,
    previewUser => previewUser.assignments,
    { onDelete: 'CASCADE' }
  )
  public previewUser: PreviewUser;

  @Index()
  @ManyToOne(type => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @ManyToOne(type => ExperimentCondition, { onDelete: 'CASCADE' })
  public experimentCondition: ExperimentCondition;
}
