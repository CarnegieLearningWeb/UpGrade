import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { MetricRepository } from '../repositories/MetricRepository';
import { QueryRepository } from '../repositories/QueryRepository';
import { Metric } from '../models/Metric';
import { SERVER_ERROR, IMetricUnit, IMetricMetaData, IGroupMetric, ISingleMetric } from 'upgrade_types';
import { SettingService } from './SettingService';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { HttpError } from '../errors';

export const METRICS_JOIN_TEXT = '@__@';

@Service()
export class MetricService {
  constructor(
    @InjectRepository() private metricRepository: MetricRepository,
    @InjectRepository() private queryRepository: QueryRepository,
    public settingService: SettingService
  ) {}

  public async getAllMetrics(logger: UpgradeLogger): Promise<IMetricUnit[]> {
    logger.info({ message: 'Get all metrics' });
    // check permission for metrics
    const metricData = await this.metricRepository.find();
    const metricKeysWithQueries = await this.queryRepository.getMetricKeysWithQueries();
    return this.metricDocumentToJson(metricData, new Set(metricKeysWithQueries));
  }

  public async getMetricsByContext(context: string, logger: UpgradeLogger): Promise<IMetricUnit[]> {
    logger.info({ message: `Get metrics by context ${context}` });
    const metricData = await this.metricRepository.getMetricsByContext(context);
    if (!metricData.length) {
      throw new HttpError(404, `Metrics context not found: ${context}`);
    }
    return this.metricDocumentToJson(metricData);
  }

  public async saveAllMetrics(
    metrics: Array<IGroupMetric | ISingleMetric>,
    contexts: string[],
    logger: UpgradeLogger
  ): Promise<Metric[]> {
    logger.info({ message: 'Save all metrics' });
    return await this.addAllMetrics(metrics, contexts, logger);
  }

  public async upsertAllMetrics(
    metrics: Array<IGroupMetric | ISingleMetric>,
    contexts: string[],
    logger: UpgradeLogger
  ): Promise<IMetricUnit[]> {
    logger.info({ message: 'Upsert all metrics' });
    const upsertedMetrics = await this.addAllMetrics(metrics, contexts, logger);
    return this.metricDocumentToJson(upsertedMetrics);
  }

  public async deleteMetric(key: string, logger: UpgradeLogger): Promise<IMetricUnit[]> {
    logger.info({ message: `Delete metric by key ${key}` });
    const experimentsUsingMetric = await this.queryRepository.getExperimentsUsingMetricKey(key, METRICS_JOIN_TEXT);
    if (experimentsUsingMetric.length) {
      const experimentNames = experimentsUsingMetric.map(({ name }) => name).join(', ');
      throw new HttpError(
        409,
        `Metric key ${key} cannot be deleted because it is used by the following experiment(s): ${experimentNames}`
      );
    }
    const result = await this.metricRepository.deleteMetricsByKeys(key, METRICS_JOIN_TEXT);
    if (!result.length) {
      throw new HttpError(404, `Metric key not found: ${key}`);
    }
    const rootKey = key.split(METRICS_JOIN_TEXT);
    const updatedMetric = await this.metricRepository.getMetricsByKeys(rootKey[0], METRICS_JOIN_TEXT);
    const metricKeysWithQueries = await this.queryRepository.getMetricKeysWithQueries();
    return this.metricDocumentToJson(updatedMetric, new Set(metricKeysWithQueries));
  }

  private async addAllMetrics(
    metrics: Array<IGroupMetric | ISingleMetric>,
    contexts: string[],
    logger: UpgradeLogger
  ): Promise<Metric[]> {
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
      context: contexts,
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

  private metricDocumentToJson(metrics: Metric[], metricKeysWithQueries?: Set<string>): IMetricUnit[] {
    const metricUnitArray: IMetricUnit[] = [];

    metrics.forEach((metric) => {
      const keyArray = metric.key.split(METRICS_JOIN_TEXT);
      let metricPointer = metricUnitArray;
      const pathUnits: IMetricUnit[] = [];

      keyArray.forEach((key) => {
        let unit = metricPointer.find((candidate) => candidate?.key === key);

        if (!unit) {
          // create the key
          unit = {
            key,
            children: [],
            metadata: { type: metric.type as any },
            allowedData: metric.allowedData,
            context: metric.context,
          };
          if (metricKeysWithQueries) {
            unit.hasQuery = false;
          }
          metricPointer.push(unit);
        }

        pathUnits.push(unit);
        metricPointer = unit.children;
      });

      // Every metric object along this metric's path (grouped or simple) carries hasQuery,
      // true if the metric itself is referenced by a query, since deleting any of them
      // would delete the metric that the query depends on.
      if (metricKeysWithQueries?.has(metric.key)) {
        pathUnits.forEach((unit) => {
          unit.hasQuery = true;
        });
      }
    });
    return metricUnitArray;
  }

  private parseMetrics(metrics: Array<IGroupMetric | ISingleMetric>): IMetricUnit[] {
    if (!metrics) return [];
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
