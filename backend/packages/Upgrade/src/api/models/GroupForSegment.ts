import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Segment } from './Segment';

@Entity()
export class GroupForSegment extends BaseModel {
  @ManyToOne(() => Segment, (segment) => segment.groupForSegment, { onDelete: 'CASCADE', primary: true })
  public segment: Segment;

  @Column({ primary: true })
  public groupId: string;

  @Column({ primary: true })
  public type: string;
}
