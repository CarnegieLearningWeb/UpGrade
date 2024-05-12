import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { Segment } from './Segment';

@Entity()
export class FeatureFlagSegmentExclusion extends BaseModel {
  @PrimaryColumn('uuid')
  @OneToOne(() => Segment, (segment) => segment.featureFlagSegmentExclusion, { onDelete: 'CASCADE' })
  @JoinColumn()
  public segment: Segment;

  @PrimaryColumn('uuid')
  @OneToOne(() => FeatureFlag, (featureFlag) => featureFlag.featureFlagSegmentExclusion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public featureFlag: FeatureFlag;
}
