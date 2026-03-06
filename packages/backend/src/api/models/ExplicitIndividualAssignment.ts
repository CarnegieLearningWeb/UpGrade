import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { ExperimentCondition } from './ExperimentCondition';
import { PreviewUser } from './PreviewUser';

@Entity()
export class ExplicitIndividualAssignment extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @ManyToOne(() => PreviewUser, (previewUser) => previewUser.assignments, { onDelete: 'CASCADE' })
  public previewUser: PreviewUser;

  @Index()
  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  public experimentCondition: ExperimentCondition;
}
