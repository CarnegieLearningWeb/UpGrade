import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { Segment } from './Segment';

@Entity()
export class FeatureFlagSegmentInclusion extends BaseModel {
  // Define primary columns for the foreign keys
  @PrimaryColumn()
  segmentId: string;

  @PrimaryColumn()
  featureFlagId: string;

  // Establish OneToOne relationship without 'primary'
  @OneToOne(() => Segment, (segment) => segment.featureFlagSegmentInclusion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'segmentId' }) // Link to the primary column
  public segment: Segment;

  // Establish ManyToOne relationship without 'primary'
  @ManyToOne(() => FeatureFlag, (featureFlag) => featureFlag.featureFlagSegmentInclusion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'featureFlagId' }) // Link to the primary column
  public featureFlag: FeatureFlag;

  @Column({
    default: false,
  })
  public enabled: boolean;

  @Column()
  public listType: string;
}
