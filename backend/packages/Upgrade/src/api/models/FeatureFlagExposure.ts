import { Entity, Index, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class FeatureFlagExposure extends BaseModel {
  @Index()
  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE', primary: true })
  public featureFlag: FeatureFlag;
  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE', primary: true })
  public experimentUser: ExperimentUser;
}
