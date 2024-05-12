import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { Segment } from './Segment';

@Entity()
export class ExperimentSegmentExclusion extends BaseModel {
  @PrimaryColumn('uuid')
  @OneToOne(() => Segment, (segment) => segment.experimentSegmentExclusion, { onDelete: 'CASCADE' })
  @JoinColumn()
  public segment: Segment;

  @PrimaryColumn('uuid')
  @OneToOne(() => Experiment, (experiment) => experiment.experimentSegmentExclusion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public experiment: Experiment;
}
