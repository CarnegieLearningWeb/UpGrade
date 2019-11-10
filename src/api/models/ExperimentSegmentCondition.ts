import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ExperimentSegment } from './ExperimentSegment';

@Entity()
export class ExperimentSegmentCondition {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  public conditionCode: string;

  @ManyToOne(type => ExperimentSegment)
  @JoinColumn([
    {
      referencedColumnName: 'point',
    },
    {
      referencedColumnName: 'id',
    },
  ])
  public experimentSegment: ExperimentSegment;

  @Column()
  public experimentConditionId: string;
}
