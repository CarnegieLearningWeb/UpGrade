import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { Segment } from './Segment';

@Entity()
export class FeatureFlagSegmentExclusion extends BaseModel {
  @OneToOne(() => Segment, (segment) => segment.featureFlagSegmentExclusion, { onDelete: 'CASCADE', primary: true })
  @JoinColumn()
  public segment: Segment;

  @OneToOne(() => FeatureFlag, (featureFlag) => featureFlag.featureFlagSegmentExclusion, {
    onDelete: 'CASCADE',
    primary: true,
  })
  @JoinColumn()
  public featureFlag: FeatureFlag;
}
