import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Segment } from './Segment';

@Entity()
export class IndividualForSegment extends BaseModel {
  @ManyToOne(() => Segment, (segment) => segment.individualForSegment, { onDelete: 'CASCADE', primary: true })
  public segment: Segment;

  @Column({ primary: true })
  public userId: string;
}
