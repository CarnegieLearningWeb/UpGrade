import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Segment } from './Segment';

@Entity()
export class GroupForSegment extends BaseModel {
  @PrimaryColumn()
  public segmentId: string;

  @ManyToOne(() => Segment, (segment) => segment.groupForSegment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segmentId' })
  public segment: Segment;

  @Column({ primary: true })
  public groupId: string;

  @Column({ primary: true })
  public type: string;
}
