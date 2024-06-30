import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class FeatureFlagExposure extends BaseModel {
  @Index()
  @PrimaryColumn('uuid')
  public featureFlagId: string;

  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  @JoinColumn()
  public featureFlag: FeatureFlag;

  @Index()
  @PrimaryColumn('uuid')
  public experimentUserId: string;

  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  @JoinColumn()
  public experimentUser: ExperimentUser;
}
