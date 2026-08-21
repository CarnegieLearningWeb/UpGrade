import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class ExperimentPrecomputedSegment extends BaseModel {
  @PrimaryColumn('uuid')
  public experimentId: string;

  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experimentId' })
  public experiment: Experiment;

  @Column('text', { array: true, default: '{}' })
  public inclusionIds: string[];

  @Column('text', { array: true, default: '{}' })
  public exclusionIds: string[];
}
