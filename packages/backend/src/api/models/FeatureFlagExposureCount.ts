import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { FeatureFlag } from './FeatureFlag';

/**
 * Running count of unique users exposed to each feature flag, one row per flag.
 *
 * Kept in step with `feature_flag_exposure` by `FeatureFlagExposureRepository.recordExposureIfNotExists()`,
 * which increments it in the same statement that inserts new exposures, so reading a flag's exposure
 * count is a primary-key lookup instead of counting every exposure row.
 *
 * Deliberately a separate, narrow table rather than a column on `feature_flag`: increments here must not
 * bump the flag's `updatedAt`/`versionNumber`, show up in flag-edit audit diffs or exports, or contend
 * with admin edits for the flag's row lock. For the same reason it doesn't extend `BaseModel`.
 */
@Entity()
export class FeatureFlagExposureCount {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_feature_flag_exposure_count' })
  public featureFlagId: string;

  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureFlagId', foreignKeyConstraintName: 'FK_feature_flag_exposure_count_feature_flag' })
  public featureFlag: FeatureFlag;

  @Column('integer', { default: 0 })
  public count: number;
}
