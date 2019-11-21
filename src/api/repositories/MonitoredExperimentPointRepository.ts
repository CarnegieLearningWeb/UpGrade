import { Repository, EntityRepository, InsertResult } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';

interface IExperimentIdAndPoint {
  id: string;
  point: string;
}
@EntityRepository(MonitoredExperimentPoint)
export class MonitoredExperimentPointRepository extends Repository<
  MonitoredExperimentPoint
> {
  public saveRawJson(rawData: MonitoredExperimentPoint): Promise<InsertResult> {
    return this.createQueryBuilder('monitoredPoint')
      .insert()
      .into(MonitoredExperimentPoint)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute();
  }

  public findManyWithExperimentIdAndPoint(
    datas: IExperimentIdAndPoint[]
  ): Promise<MonitoredExperimentPoint[]> {
    let queryBuilder = this.createQueryBuilder('monitoredPoint');
    datas.forEach(({ id, point }, index) => {
      if (index === 0) {
        queryBuilder = queryBuilder.where(
          'monitoredPoint.experimentId = :id AND monitoredPoint.experimentPoint = :point',
          { id, point }
        );
      } else {
        queryBuilder = queryBuilder.orWhere(
          'monitoredPoint.experimentId = :id AND monitoredPoint.experimentPoint = :point',
          { id, point }
        );
      }
    });

    return queryBuilder.getMany();
  }
}
