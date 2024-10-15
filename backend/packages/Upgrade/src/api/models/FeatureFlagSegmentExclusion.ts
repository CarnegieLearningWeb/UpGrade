import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { Segment } from './Segment';

@Entity()
export class FeatureFlagSegmentExclusion extends BaseModel {
  // Define primary columns for the foreign keys
  @PrimaryColumn()
  segmentId: number;

  @PrimaryColumn()
  featureFlagId: number;

  // Establish OneToOne relationship without 'primary'
  @OneToOne(() => Segment, (segment) => segment.featureFlagSegmentExclusion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'segmentId' }) // Link to the primary column
  public segment: Segment;

  // Establish ManyToOne relationship without 'primary'
  @ManyToOne(() => FeatureFlag, (featureFlag) => featureFlag.featureFlagSegmentExclusion, {
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
