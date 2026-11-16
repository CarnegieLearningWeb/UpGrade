import { In, Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { FeatureFlagExposure } from '../models/FeatureFlagExposure';
import { FeatureFlagExposureCount } from '../models/FeatureFlagExposureCount';
import { DATE_RANGE } from 'upgrade_types';
import { getDateVariables } from './utils/dateQuery';

/**
 * Inserts any (flag, user) exposures that don't exist yet and, in the same statement, adds the number
 * actually inserted per flag to `feature_flag_exposure_count`. ON CONFLICT DO NOTHING means only
 * first-time exposures come back from RETURNING, so a user is counted once per flag even when
 * concurrent requests race to insert the same pair. One statement keeps the insert and the count
 * atomic. Counter rows are upserted in "featureFlagId" order so two statements touching the same flags
 * always lock their counter rows in the same order and can't deadlock.
 */
const RECORD_EXPOSURES_AND_COUNT_SQL = `
  WITH inserted AS (
    INSERT INTO "feature_flag_exposure" ("featureFlagId", "experimentUserId", "versionNumber")
    SELECT flag."id", $2, 1
    FROM unnest($1::uuid[]) AS flag("id")
    ON CONFLICT DO NOTHING
    RETURNING "featureFlagId"
  )
  INSERT INTO "feature_flag_exposure_count" ("featureFlagId", "count")
  SELECT "featureFlagId", COUNT(*)::int
  FROM inserted
  GROUP BY "featureFlagId"
  ORDER BY "featureFlagId"
  ON CONFLICT ("featureFlagId")
  DO UPDATE SET "count" = "feature_flag_exposure_count"."count" + EXCLUDED."count"
`;

@EntityRepository(FeatureFlagExposure)
export class FeatureFlagExposureRepository extends Repository<FeatureFlagExposure> {
  public async recordExposureIfNotExists(flagIds: string[], experimentUserId: string): Promise<void> {
    if (!flagIds.length) return;
    await this.manager.query(RECORD_EXPOSURES_AND_COUNT_SQL, [flagIds, experimentUserId]);
  }

  /**
   * Unique-user exposure counts for the given flags, keyed by flag id. Flags with no exposures yet
   * have no counter row and are absent from the map.
   */
  public async getExposureCountsByFlagIds(flagIds: string[]): Promise<Map<string, number>> {
    if (!flagIds.length) return new Map();
    const rows = await this.manager.findBy(FeatureFlagExposureCount, { featureFlagId: In(flagIds) });
    return new Map(rows.map((row) => [row.featureFlagId, row.count]));
  }

  public async getExposuresByDateRange(flagId: string, dateRange: DATE_RANGE, clientOffset: number) {
    const { whereDate, selectRange } = getDateVariables(dateRange, clientOffset, 'feature_flag_exposure');
    const query = this.createQueryBuilder('feature_flag_exposure')
      .select(['count(distinct("feature_flag_exposure"."experimentUserId"))::int', selectRange])
      .where('"feature_flag_exposure"."featureFlagId" = :id', { id: flagId });
    if (dateRange !== DATE_RANGE.TOTAL) {
      query.andWhere(whereDate);
    }
    query.addGroupBy('date_range');
    return await query.execute();
  }
}
