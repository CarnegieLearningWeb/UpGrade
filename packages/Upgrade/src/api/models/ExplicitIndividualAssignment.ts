import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
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
    previewUser => previewUser.assignments
  )
  public previewUser: PreviewUser;

  @ManyToOne(type => Experiment)
  public experiment: Experiment;

  @ManyToOne(type => ExperimentCondition)
  public experimentCondition: ExperimentCondition;
}
