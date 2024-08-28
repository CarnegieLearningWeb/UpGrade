import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';
import { Segment } from './Segment';

@Entity()
export class ExperimentSegmentExclusion extends BaseModel {
  @PrimaryColumn()
  public segmentId: string;

  @OneToOne(() => Segment, (segment) => segment.experimentSegmentExclusion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segmentId' })
  public segment: Segment;

  @PrimaryColumn()
  public experimentId: string;

  @OneToOne(() => Experiment, (experiment) => experiment.experimentSegmentExclusion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'experimentId' })
  public experiment: Experiment;
}
