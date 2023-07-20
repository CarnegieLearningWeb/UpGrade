import { IMetricMetaData, ISingleMetric, IGroupMetric } from 'upgrade_types';

export const metrics: Array<Partial<ISingleMetric | IGroupMetric>> = [
  {
    metric: 'totalProblemsCompleted',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    metric: 'totalTimeSeconds',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    metric: 'totalMasteryWorkspacesCompleted',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    metric: 'totalConceptBuildersCompleted',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    metric: 'totalMasteryWorkspacesGraduated',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    metric: 'totalSessionsCompleted',
    datatype: IMetricMetaData.CONTINUOUS,
  },
  {
    groupClass: 'masteryWorkspace',
    allowedKeys: ['calculating_area_figures', 'calculating_area_various_figures'],
    attributes: [
      {
        metric: 'timeSeconds',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'hintCount',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'errorCount',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'completionCount',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'problemsCompleted',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'workspaceCompletionStatus',
        datatype: IMetricMetaData.CATEGORICAL,
        allowedValues: ['GRADUATED', 'PROMOTED'],
      },
      {
        metric: 'completion',
        datatype: IMetricMetaData.CATEGORICAL,
        allowedValues: ['GRADUATED', 'PROMOTED'],
      },
    ],
  },
  {
    groupClass: 'addWorkspace',
    allowedKeys: ['level1', 'level2'],
    attributes: [
      {
        metric: 'timeSpent',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'workspaceCompletionStatus',
        datatype: IMetricMetaData.CATEGORICAL,
        allowedValues: ['GRADUATED', 'PROMOTED'],
      },
    ],
  },
  {
    groupClass: 'conceptBuilderWorkspace',
    allowedKeys: ['calculating_area_figures', 'calculating_area_various_figures', 'adding_and_subtracting_decimals'],
    attributes: [
      {
        metric: 'timeSeconds',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'hintCount',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'errorCount',
        datatype: IMetricMetaData.CONTINUOUS,
      },
      {
        metric: 'completionCount',
        datatype: IMetricMetaData.CONTINUOUS,
      },
    ],
  },
];
