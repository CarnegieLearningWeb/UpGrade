import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class FeatureFlagExposure extends BaseModel {
  @Index()
  @PrimaryColumn('uuid')
  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  public featureFlag: FeatureFlag;
  @Index()
  @PrimaryColumn('uuid')
  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  public experimentUser: ExperimentUser;
}
