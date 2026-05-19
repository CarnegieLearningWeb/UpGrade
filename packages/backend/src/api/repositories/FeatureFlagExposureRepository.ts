import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { FeatureFlagExposure } from '../models/FeatureFlagExposure';
import { DATE_RANGE } from 'upgrade_types';
import { getDateVariables } from './utils/dateQuery';

@EntityRepository(FeatureFlagExposure)
export class FeatureFlagExposureRepository extends Repository<FeatureFlagExposure> {
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
