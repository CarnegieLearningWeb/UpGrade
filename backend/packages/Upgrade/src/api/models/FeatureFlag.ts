import { Column, Entity, PrimaryColumn, OneToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { Type } from 'class-transformer';
import { FeatureFlagSegmentInclusion } from './FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from './FeatureFlagSegmentExclusion';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';
@Entity()
export class FeatureFlag extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column('text', { unique: true })
  public key: string;

  @Column()
  public description: string;

  @Column('text', { array: true })
  public context: string[];

  @Column('text', { array: true, nullable: true })
  public tags: string[];

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: FEATURE_FLAG_STATUS,
    default: FEATURE_FLAG_STATUS.DISABLED,
  })
  public status: FEATURE_FLAG_STATUS;

  @OneToOne(() => FeatureFlagSegmentInclusion, (featureFlagSegmentInclusion) => featureFlagSegmentInclusion.featureFlag)
  @Type(() => FeatureFlagSegmentInclusion)
  public featureFlagSegmentInclusion: FeatureFlagSegmentInclusion;

  @OneToOne(() => FeatureFlagSegmentExclusion, (featureFlagSegmentExclusion) => featureFlagSegmentExclusion.featureFlag)
  @Type(() => FeatureFlagSegmentExclusion)
  public featureFlagSegmentExclusion: FeatureFlagSegmentExclusion;
}
