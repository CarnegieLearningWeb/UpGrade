import { Column, Entity, PrimaryColumn, OneToMany, Unique } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { Type } from 'class-transformer';
import { FEATURE_FLAG_STATUS, FILTER_MODE } from 'upgrade_types';
import { FeatureFlagSegmentInclusion } from './FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from './FeatureFlagSegmentExclusion';
@Entity()
@Unique(['key', 'context'])
export class FeatureFlag extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column('text')
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

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: FILTER_MODE,
    default: FILTER_MODE.INCLUDE_ALL,
  })
  public filterMode: FILTER_MODE;

  @OneToMany(
    () => FeatureFlagSegmentInclusion,
    (featureFlagSegmentInclusion) => featureFlagSegmentInclusion.featureFlag
  )
  @Type(() => FeatureFlagSegmentInclusion)
  public featureFlagSegmentInclusion: FeatureFlagSegmentInclusion[];

  @OneToMany(
    () => FeatureFlagSegmentExclusion,
    (featureFlagSegmentExclusion) => featureFlagSegmentExclusion.featureFlag
  )
  @Type(() => FeatureFlagSegmentExclusion)
  public featureFlagSegmentExclusion: FeatureFlagSegmentExclusion[];
}
