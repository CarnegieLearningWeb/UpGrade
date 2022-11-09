import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { MetricRepository } from '../repositories/MetricRepository';
import { Metric } from '../models/Metric';
import { SERVER_ERROR, IMetricUnit, IMetricMetaData, IGroupMetric, ISingleMetric } from 'upgrade_types';
import { SettingService } from './SettingService';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

export const METRICS_JOIN_TEXT = '@__@';

@Service()
export class MetricService {
  constructor(@OrmRepository() private metricRepository: MetricRepository, public settingService: SettingService) {}

  public async getAllMetrics(logger: UpgradeLogger): Promise<IMetricUnit[]> {
    logger.info({ message: 'Get all metrics' });
    // check permission for metrics
    const metricData = await this.metricRepository.find();
    return this.metricDocumentToJson(metricData);
  }

  public async saveAllMetrics(metrics: Array<IGroupMetric | ISingleMetric>, logger: UpgradeLogger): Promise<Metric[]> {
    logger.info({ message: 'Save all metrics' });
    return await this.addAllMetrics(metrics, logger);
  }

  public async upsertAllMetrics(
    metrics: Array<IGroupMetric | ISingleMetric>,
    logger: UpgradeLogger
  ): Promise<IMetricUnit[]> {
    logger.info({ message: 'Upsert all metrics' });
    const upsertedMetrics = await this.addAllMetrics(metrics, logger);
    return this.metricDocumentToJson(upsertedMetrics);
  }

  public async deleteMetric(key: string, logger: UpgradeLogger): Promise<IMetricUnit[]> {
    logger.info({ message: `Delete metric by key ${key}` });
    await this.metricRepository.deleteMetricsByKeys(key, METRICS_JOIN_TEXT);
    const rootKey = key.split(METRICS_JOIN_TEXT);
    const updatedMetric = await this.metricRepository.getMetricsByKeys(rootKey[0], METRICS_JOIN_TEXT);
    return this.metricDocumentToJson(updatedMetric);
  }

  private async addAllMetrics(metrics: Array<IGroupMetric | ISingleMetric>, logger: UpgradeLogger): Promise<Metric[]> {
    // check permission for metrics
    const isAllowed = await this.checkMetricsPermission(logger);
    if (!isAllowed) {
      const error = new Error('Metrics filter not enabled');
      (error as any).type = SERVER_ERROR.INVALID_TOKEN;
      logger.error(error);
      throw error;
    }
    // create query for metrics
    const formattedMetrics = this.parseMetrics(metrics);
    const keyArray = this.metricJsonToDocument(formattedMetrics);
    const metricDoc: any[] = keyArray.map((metric) => ({
      key: metric.key,
      type: metric.type,
      allowedData: metric.allowedData,
    }));
    return this.metricRepository.save(metricDoc);
  }

  private async checkMetricsPermission(logger: UpgradeLogger): Promise<boolean> {
    const setting = await this.settingService.getClientCheck(logger);
    return setting.toFilterMetric;
  }

  private metricJsonToDocument(
    metricUnitArray: IMetricUnit[]
  ): Array<{ key: string; type: IMetricMetaData; allowedData: string[] }> {
    const keyArrayAndMeta = [];

    function returnKeyArray(metricUnit: IMetricUnit, keyName: string): void {
      if (!metricUnit.children) {
        metricUnit.children = [];
      }

      if (metricUnit.children.length === 0) {
        // exit condition
        let keys = [];
        if (typeof metricUnit.key === 'string') {
          keys = [metricUnit.key];
        } else if (Array.isArray(metricUnit.key)) {
          keys = metricUnit.key;
        }
        keys.forEach((key) => {
          const leafPath = keyName === '' ? key : `${keyName}${METRICS_JOIN_TEXT}${key}`;
          keyArrayAndMeta.push({
            key: leafPath,
            type: (metricUnit.metadata && metricUnit.metadata.type) || IMetricMetaData.CONTINUOUS,
            allowedData: metricUnit.allowedData,
          });
        });
        return;
      }

      metricUnit.children.forEach((unit) => {
        let keys = [];
        if (typeof metricUnit.key === 'string') {
          keys = [metricUnit.key];
        } else if (Array.isArray(metricUnit.key)) {
          keys = metricUnit.key;
        }
        keys.forEach((key) => {
          const newKey = keyName === '' ? key : `${keyName}${METRICS_JOIN_TEXT}${key}`;
          return `${returnKeyArray(unit, newKey as any)}`;
        });
      });
    }

    metricUnitArray.forEach((metricUnit) => {
      return returnKeyArray(metricUnit, '');
    });

    return keyArrayAndMeta;
  }

  private metricDocumentToJson(metrics: Metric[]): IMetricUnit[] {
    const metricUnitArray: IMetricUnit[] = [];

    metrics.forEach((metric) => {
      const keyArray = metric.key.split(METRICS_JOIN_TEXT);
      let metricPointer = metricUnitArray;
      keyArray.forEach((key) => {
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
            metadata: { type: metric.type as any },
            allowedData: metric.allowedData,
          };
          metricPointer.push(newMetric);

          metricPointer = newMetric.children;
        }
      });
    });
    return metricUnitArray;
  }

  private parseMetrics(metrics: Array<IGroupMetric | ISingleMetric>): IMetricUnit[] {
    return metrics.map((data: any) => {
      if (data.metric) {
        return {
          key: data.metric,
          metadata: {
            type: data.datatype,
          },
          allowedData: data.allowedValues,
        };
      } else {
        return this.convertGroupMetrics(data);
      }
    });
  }

  private convertGroupMetrics(metric: IGroupMetric): IMetricUnit {
    function formKeyChildrenFormat(groupMetric: any): any {
      if (groupMetric.metric) {
        return {
          key: groupMetric.metric,
          metadata: {
            type: groupMetric.datatype,
          },
          allowedData: groupMetric.allowedValues,
        };
      } else if (groupMetric.groupClass) {
        const newChildren = groupMetric.allowedKeys.map((allowedKey) => ({
          key: allowedKey,
          children: groupMetric.attributes || [],
        }));
        return {
          key: groupMetric.groupClass,
          children: newChildren.map((child) => ({
            key: child.key,
            children: child.children.map((child1) => formKeyChildrenFormat(child1)),
          })),
        };
      }
    }

    return formKeyChildrenFormat(metric);
  }
}
