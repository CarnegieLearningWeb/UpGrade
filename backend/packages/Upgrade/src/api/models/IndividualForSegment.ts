import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Segment } from './Segment';

@Entity()
export class IndividualForSegment extends BaseModel {
  @PrimaryColumn()
  public segmentId: string;

  @ManyToOne(() => Segment, (segment) => segment.individualForSegment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segmentId' })
  public segment: Segment;

  @PrimaryColumn()
  public userId: string;
}
