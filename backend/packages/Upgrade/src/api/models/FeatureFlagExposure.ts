import { Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class FeatureFlagExposure extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Index()
  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  public featureFlag: FeatureFlag;

  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public experimentUser: ExperimentUser;
}
