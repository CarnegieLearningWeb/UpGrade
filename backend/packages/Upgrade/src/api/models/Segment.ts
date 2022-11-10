import { Type } from 'class-transformer';
import { Column, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { SEGMENT_TYPE } from 'upgrade_types';
import { BaseModel } from './base/BaseModel';
import { ExperimentSegmentExclusion } from './ExperimentSegmentExclusion';
import { ExperimentSegmentInclusion } from './ExperimentSegmentInclusion';
import { GroupForSegment } from './GroupForSegment';
import { IndividualForSegment } from './IndividualForSegment';

@Entity()
export class Segment extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  public name: string;

  @Column({
    nullable: true,
  })
  public description: string;

  @Column()
  public context: string;

  @Column({
    type: 'enum',
    enum: SEGMENT_TYPE,
    default: SEGMENT_TYPE.PUBLIC,
  })
  public type: SEGMENT_TYPE;

  @OneToMany(() => IndividualForSegment, (individualForSegment) => individualForSegment.segment)
  @Type(() => IndividualForSegment)
  public individualForSegment: IndividualForSegment[];

  @OneToMany(() => GroupForSegment, (groupForSegment) => groupForSegment.segment)
  @Type(() => GroupForSegment)
  public groupForSegment: GroupForSegment[];

  @ManyToMany(() => Segment, (segment) => segment.subSegments)
  @JoinTable({
    name: 'segment_for_segment',
    joinColumn: {
      name: 'childSegmentId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'parentSegmentId',
      referencedColumnName: 'id',
    },
  })
  public segments: Segment[];

  @ManyToMany(() => Segment, (segment) => segment.segments, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  public subSegments: Segment[];

  @OneToOne(() => ExperimentSegmentInclusion, (experimentSegmentInclusion) => experimentSegmentInclusion.segment)
  @Type(() => ExperimentSegmentInclusion)
  public experimentSegmentInclusion: ExperimentSegmentInclusion;

  @OneToOne(() => ExperimentSegmentExclusion, (experimentSegmentExclusion) => experimentSegmentExclusion.segment)
  @Type(() => ExperimentSegmentExclusion)
  public experimentSegmentExclusion: ExperimentSegmentExclusion;
}
