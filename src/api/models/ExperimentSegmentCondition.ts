import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { ExperimentSegment } from './ExperimentSegment';

@Entity()
export class ExperimentSegmentCondition {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  public conditionCode: string;

  @ManyToOne(type => ExperimentSegment, experimentSegment => experimentSegment.segmentConditions)
  public experimentSegment: ExperimentSegment;

  @Column()
  public experimentConditionId: string;
}
