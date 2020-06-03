import { Service } from 'typedi';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { MetricRepository } from '../repositories/MetricRepository';
import { Metric } from '../models/Metric';
import { MetricUnit } from '../../types/ExperimentInput';
import { SERVER_ERROR } from 'upgrade_types';
import { SettingService } from './SettingService';

export const METRICS_JOIN_TEXT = '@__@';

@Service()
export class MetricService {
  constructor(
    @Logger(__filename) private log: LoggerInterface,
    @OrmRepository() private metricRepository: MetricRepository,
    public settingService: SettingService
  ) {}

  public async getAllMetrics(): Promise<MetricUnit[]> {
    this.log.info('Get all metrics');
    // check permission for metrics
    const metricData = await this.metricRepository.find();
    return this.metricDocumentToJson(metricData);
  }

  public async saveAllMetrics(metrics: MetricUnit[]): Promise<MetricUnit[]> {
    this.log.info('Save all metrics');
    // check permission for metrics
    const isAllowed = await this.checkMetricsPermission();
    if (!isAllowed) {
      throw new Error(JSON.stringify({ type: SERVER_ERROR.INVALID_TOKEN, message: 'Metrics filter not enabled' }));
    }
    // create query for metrics
    const keyArray = this.metricJsonToDocument(metrics);
    const metricDoc: any[] = keyArray.map((metric) => ({
      key: metric,
    }));
    return this.metricRepository.save(metricDoc);
  }

  private async checkMetricsPermission(): Promise<boolean> {
    const setting = await this.settingService.getClientCheck();
    return setting.toFilterMetric;
  }

  private metricJsonToDocument(metricUnitArray: MetricUnit[]): string[] {
    const keyArray = [];

    function returnKeyArray(metricUnit: MetricUnit, keyName: string): void {
      if (metricUnit.children.length === 0) {
        // exit condition
        const leafPath = keyName === '' ? metricUnit.key : `${keyName}${METRICS_JOIN_TEXT}${metricUnit.key}`;
        keyArray.push(leafPath);
        return;
      }

      metricUnit.children.forEach((unit) => {
        const newKey = keyName === '' ? metricUnit.key : `${keyName}${METRICS_JOIN_TEXT}${metricUnit.key}`;
        return `${returnKeyArray(unit, newKey)}`;
      });
    }

    metricUnitArray.forEach((metricUnit) => {
      return returnKeyArray(metricUnit, '');
    });

    return keyArray;
  }

  private metricDocumentToJson(metrics: Metric[]): MetricUnit[] {
    const metricUnitArray: MetricUnit[] = [];

    metrics.forEach((metric) => {
      const keyArray = metric.key.split(METRICS_JOIN_TEXT);
      let metricPointer = metricUnitArray;
      keyArray.forEach((key, index) => {
        const keyExist = metricPointer.reduce((aggregator, unit) => {
          const isKey = unit && unit.key === key ? true : false;
          if (isKey) {
            metricPointer = unit.children;
          }
          return aggregator || isKey;
        }, false);

        if (keyExist === false) {
          // create the key
          const newMetric = {
            key,
            children: [],
          };
          metricPointer.push(newMetric);

          metricPointer = newMetric.children;
        }
      });
    });
    return metricUnitArray;
  }
}
