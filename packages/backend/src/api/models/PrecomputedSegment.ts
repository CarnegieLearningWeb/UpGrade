import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';

@Entity()
export class PrecomputedSegment extends BaseModel {
  @PrimaryColumn('uuid')
  public featureFlagId: string;

  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureFlagId' })
  public featureFlag: FeatureFlag;

  @Column('text', { array: true, default: '{}' })
  public inclusionIds: string[];

  @Column('text', { array: true, default: '{}' })
  public exclusionIds: string[];
}
