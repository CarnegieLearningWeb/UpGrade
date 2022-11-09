import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { Segment } from './Segment';

@Entity()
export class ExperimentSegmentInclusion extends BaseModel {
  @OneToOne(() => Segment, (segment) => segment.experimentSegmentInclusion, { onDelete: 'CASCADE', primary: true })
  @JoinColumn()
  public segment: Segment;

  @OneToOne(() => Experiment, (experiment) => experiment.experimentSegmentInclusion, {
    onDelete: 'CASCADE',
    primary: true,
  })
  @JoinColumn()
  public experiment: Experiment;
}
