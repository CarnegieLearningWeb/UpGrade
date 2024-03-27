import { Column, Entity, PrimaryColumn, OneToMany, OneToOne } from 'typeorm';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { Type } from 'class-transformer';
import { FlagVariation } from './FlagVariation';
import { FeatureFlagSegmentInclusion } from './FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from './FeatureFlagSegmentExclusion';

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

  @Column()
  public variationType: string;

  @Column()
  public status: boolean;

  @OneToMany(() => FlagVariation, (variation) => variation.featureFlag)
  @ValidateNested()
  @Type(() => FlagVariation)
  public variations: FlagVariation[];

  @OneToOne(() => FeatureFlagSegmentInclusion, (featureFlagSegmentInclusion) => featureFlagSegmentInclusion.featureFlag)
  @Type(() => FeatureFlagSegmentInclusion)
  public featureFlagSegmentInclusion: FeatureFlagSegmentInclusion;

  @OneToOne(() => FeatureFlagSegmentExclusion, (featureFlagSegmentExclusion) => featureFlagSegmentExclusion.featureFlag)
  @Type(() => FeatureFlagSegmentExclusion)
  public featureFlagSegmentExclusion: FeatureFlagSegmentExclusion;
}
