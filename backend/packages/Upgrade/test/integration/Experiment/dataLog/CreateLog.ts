import Container from 'typedi';
import { getRepository } from 'typeorm';
import { Metric } from '../../../../src/api/models/Metric';
import { MetricService, METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { SettingService } from '../../../../src/api/services/SettingService';
import { Log } from '../../../../src/api/models/Log';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { IMetricMetaData, OPERATION_TYPES } from 'upgrade_types';
import { metrics } from '../../mockData/metric';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';

export default async function CreateLog(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const metricRepository = getRepository(Metric);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const metricService = Container.get<MetricService>(MetricService);
  const settingService = Container.get<SettingService>(SettingService);
  let experimentObject: any = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);
  const logRepository = getRepository(Log);

  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  await settingService.setClientCheck(false, true, new UpgradeLogger());

  await metricService.saveAllMetrics(metrics as any, new UpgradeLogger());

  const findMetric = await metricRepository.find();
  expect(findMetric.length).toEqual(36);
  expect(findMetric).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: `totalTimeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalMasteryWorkspacesCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalConceptBuildersCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalMasteryWorkspacesGraduated`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalSessionsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `totalProblemsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),

      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}timeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}hintCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}errorCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}completionCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}problemsCompleted`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_figures${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: IMetricMetaData.CATEGORICAL,
        allowedData: ['GRADUATED', 'PROMOTED'],
      }),

      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}timeSeconds`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}hintCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}errorCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
      expect.objectContaining({
        key: `conceptBuilderWorkspace${METRICS_JOIN_TEXT}adding_and_subtracting_decimals${METRICS_JOIN_TEXT}completionCount`,
        type: IMetricMetaData.CONTINUOUS,
      }),
    ])
  );

  const timestampOld = new Date().toISOString();
  let timestamp = new Date().toISOString();

  // create log
  const experimentUser = experimentUsers[0];
  let jsonData: any = [
    {
      timestamp,
      metrics: {
        attributes: {
          totalTimeSeconds: 123456,
          totalProblemsCompleted: 48,
        },
      },
    },
  ];
  // getOriginalUserDoc
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUser.id, new UpgradeLogger());
  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  // create query for all the metrics
  const totalTimeSum = makeQuery(`totalTimeSeconds`, OPERATION_TYPES.SUM, experiments[0].id);
  const totalMasteryWorkspaceSum = makeQuery(`totalMasteryWorkspacesCompleted`, OPERATION_TYPES.SUM, experiments[0].id);
  const totalConceptBuildersCompletedSum = makeQuery(
    `totalConceptBuildersCompleted`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );
  const totalMasteryWorkspacesGraduatedSum = makeQuery(
    `totalMasteryWorkspacesGraduated`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );
  const totalSessionsCompletedSum = makeQuery(`totalSessionsCompleted`, OPERATION_TYPES.SUM, experiments[0].id);
  const totalProblemsCompletedSum = makeQuery(`totalProblemsCompleted`, OPERATION_TYPES.SUM, experiments[0].id);

  // make nested query
  const masteryWorkspaceFiguresTimeSecondsSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}timeSeconds`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const masteryWorkspaceFiguresHintCountSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}hintCount`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const masteryWorkspaceFiguresErrorCountSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}errorCount`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const masteryWorkspaceFiguresCompletionCountSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}completionCount`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const masteryWorkspaceFiguresWorkspaceCompletionStatusSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  const masteryWorkspaceFiguresproblemsCompletedSum = makeQuery(
    `masteryWorkspace${METRICS_JOIN_TEXT}calculating_area_various_figures${METRICS_JOIN_TEXT}problemsCompleted`,
    OPERATION_TYPES.SUM,
    experiments[0].id
  );

  experimentObject = {
    ...experimentObject,
    queries: [
      totalTimeSum,
      totalMasteryWorkspaceSum,
      totalConceptBuildersCompletedSum,
      totalMasteryWorkspacesGraduatedSum,
      totalSessionsCompletedSum,
      totalProblemsCompletedSum,
      masteryWorkspaceFiguresTimeSecondsSum,
      masteryWorkspaceFiguresHintCountSum,
      masteryWorkspaceFiguresErrorCountSum,
      masteryWorkspaceFiguresCompletionCountSum,
      masteryWorkspaceFiguresWorkspaceCompletionStatusSum,
      masteryWorkspaceFiguresproblemsCompletedSum,
    ],
  };

  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  let logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalTimeSeconds: 123456,
          totalProblemsCompleted: 48,
        },
      }),
    ])
  );

  // overwrite part of metrics
  timestamp = new Date().toISOString();

  jsonData = [
    {
      timestamp,
      metrics: {
        attributes: {
          totalTimeSeconds: 123,
          totalProblemsCompleted: 4,
        },
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalTimeSeconds: 123,
          totalProblemsCompleted: 4,
        },
      }),
    ])
  );

  // overwrite part of metrics
  timestamp = new Date().toISOString();

  jsonData = [
    {
      timestamp,
      metrics: {
        attributes: {
          totalTimeSeconds: 1,
          totalProblemsCompleted: 2,
          totalSessionsCompleted: 14,
          totalConceptBuildersCompleted: 1,
          totalMasteryWorkspacesCompleted: 4,
        },
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalTimeSeconds: 1,
          totalProblemsCompleted: 2,
        },
      }),
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalSessionsCompleted: 14,
          totalConceptBuildersCompleted: 1,
          totalMasteryWorkspacesCompleted: 4,
        },
      }),
    ])
  );

  // ignore changes with old timestamp
  jsonData = [
    {
      timestamp: timestampOld,
      metrics: {
        attributes: {
          totalTimeSeconds: 2,
          totalProblemsCompleted: 5,
          totalSessionsCompleted: 145,
          totalConceptBuildersCompleted: 12,
          totalMasteryWorkspacesCompleted: 47,
        },
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalTimeSeconds: 1,
          totalProblemsCompleted: 2,
        },
      }),
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalSessionsCompleted: 14,
          totalConceptBuildersCompleted: 1,
          totalMasteryWorkspacesCompleted: 4,
        },
      }),
    ])
  );

  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        attributes: {
          totalTimeSeconds: 1,
          totalProblemsCompleted: 1,
          totalSessionsCompleted: 1,
          totalConceptBuildersCompleted: 1,
          totalMasteryWorkspacesCompleted: 1,
          totalMasteryWorkspacesGraduated: 1,
        },
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalTimeSeconds: 1,
          totalProblemsCompleted: 1,
        },
      }),
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalSessionsCompleted: 1,
          totalConceptBuildersCompleted: 1,
          totalMasteryWorkspacesCompleted: 1,
        },
      }),
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          totalMasteryWorkspacesGraduated: 1,
        },
      }),
    ])
  );

  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '1',
            attributes: {
              timeSeconds: 246,
              hintCount: 25,
              // errorCount: 48,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 12,
            },
          },
        ],
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 246,
              hintCount: 25,
              // errorCount: 48,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 12,
            },
          },
        },
      }),
    ])
  );

  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '2',
            attributes: {
              timeSeconds: 2,
              hintCount: 2,
              // errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 1,
            },
          },
        ],
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        // timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 246,
              hintCount: 25,
              // errorCount: 48,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 12,
            },
          },
        },
      }),
      expect.objectContaining({
        uniquifier: '2',
        timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 2,
              hintCount: 2,
              // errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 1,
            },
          },
        },
      }),
    ])
  );

  // metric log to be ignored
  jsonData = [
    {
      timestamp: timestampOld,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '1',
            attributes: {
              timeSeconds: 2,
              hintCount: 2,
              // errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 1,
            },
          },
        ],
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        // timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 246,
              hintCount: 25,
              // errorCount: 48,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 12,
            },
          },
        },
      }),
      expect.objectContaining({
        uniquifier: '2',
        timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 2,
              hintCount: 2,
              // errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 1,
            },
          },
        },
      }),
    ])
  );

  timestamp = new Date().toISOString();
  jsonData = [
    {
      timestamp,
      metrics: {
        groupedMetrics: [
          {
            groupClass: 'masteryWorkspace',
            groupKey: 'calculating_area_various_figures',
            groupUniquifier: '1',
            attributes: {
              timeSeconds: 2,
              hintCount: 2,
              errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 1,
            },
          },
        ],
      },
    },
  ];

  // log data here
  await experimentAssignmentService.dataLog(experimentUser.id, jsonData, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });

  logData = await logRepository.find({
    relations: ['metrics'],
  });

  expect(logData).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uniquifier: '1',
        // timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 2,
              hintCount: 2,
              // errorCount: 48,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 12,
            },
          },
        },
      }),
      expect.objectContaining({
        uniquifier: '1',
        timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 12,
            },
          },
        },
      }),
      expect.objectContaining({
        uniquifier: '2',
        // timeStamp: new Date(timestamp),
        data: {
          masteryWorkspace: {
            calculating_area_various_figures: {
              timeSeconds: 2,
              hintCount: 2,
              // errorCount: 4,
              // completionCount: 1,
              // workspaceCompletionStatus: 'GRADUATED',
              // problemsCompleted: 1,
            },
          },
        },
      }),
    ])
  );
}

function makeQuery(metric: string, operationType: OPERATION_TYPES, experimentId: string): any {
  return {
    name: 'query',
    query: {
      operationType,
    },
    metric: {
      key: metric,
    },
    experimentId,
  };
}
