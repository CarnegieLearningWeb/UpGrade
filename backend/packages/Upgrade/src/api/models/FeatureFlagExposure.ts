import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class FeatureFlagExposure extends BaseModel {
  // Define primary column for the foreign key
  @PrimaryColumn()
  featureFlagId: string;

  // Define primary column for the foreign key
  @PrimaryColumn()
  experimentUserId: string;

  @Index()
  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  public featureFlag: FeatureFlag;
  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public experimentUser: ExperimentUser;
}
