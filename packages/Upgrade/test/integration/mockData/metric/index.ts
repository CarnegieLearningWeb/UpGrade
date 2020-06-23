import { ISingleMetric, IGroupMetric } from 'packages/Upgrade/src/api/services/MetricService';
import { IMetricMetaData } from 'upgrade_types';

export const metrics: Array<Partial<ISingleMetric | IGroupMetric>> = [
  {
    metric: 'totalProblemsCompleted',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    groupClass: 'masteryWorkspace',
    allowedKeys: [
      'calculating_area_figures',
    ],
    attributes: [
      {
        metric: 'timeSeconds',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'completion',
        datatype: IMetricMetaData.CATEGORICAL,
        allowedValues: ['GRADUATED', 'PROMOTED'],
      },
    ],
  },
];
