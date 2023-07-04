import { withinSubjectExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';
import { checkMarkExperimentPointForUser, getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';
import { METRICS_JOIN_TEXT } from '../../../../src/api/services/MetricService';
import { QueryService } from '../../../../src/api/services/QueryService';

export default async function MetricQueriesCheck(): Promise<void> {
  const userService = Container.get<UserService>(UserService);
  const queryService = Container.get<QueryService>(QueryService);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(withinSubjectExperiment, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
  const experimentId = experiments[0].id;

  const metricsQueries = [
    {
      name: 'Percent of times the Most Recent workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.PERCENTAGE,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: 'categorical',
        allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Percent of times the Earliest workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.PERCENTAGE,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: 'categorical',
        allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of times the Most Recent workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.COUNT,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        // type: 'categorical',
        // allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of times the Earliest workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.COUNT,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace@__@level1@__@workspaceCompletionStatus`,
        // type: 'categorical',
        // allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
  ];

  /*const metricsQueries = [
    {
      name: 'Percent of times the Most Recent workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.PERCENTAGE,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: 'categorical',
        allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Percent of times the Earliest workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.PERCENTAGE,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: 'categorical',
        allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of times the Most Recent workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.COUNT,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: 'categorical',
        allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of times the Earliest workspaceCompletionStatus=GRADUATED for level1 (addWorkspace)',
      query: {
        operationType: OPERATION_TYPES.COUNT,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}workspaceCompletionStatus`,
        type: 'categorical',
        allowedData: ['GRADUATED', 'PROMOTED'],
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Sum of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.SUM,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Min of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MIN,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Max of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MAX,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.COUNT,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Mean of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.AVERAGE,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Median of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MEDIAN,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Mode of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MODE,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Standard Deviation of the Most Recent timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.STDEV,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Sum of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.SUM,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Min of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MIN,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Max of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MAX,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.COUNT,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Mean of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.AVERAGE,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Median of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MEDIAN,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Mode of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MODE,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Standard Deviation of the Earliest timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.STDEV,
      },
      repeatedMeasure: REPEATED_MEASURE.earliest,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Sum of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.SUM,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Min of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MIN,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Max of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MAX,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Count of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.COUNT,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Mean of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.AVERAGE,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Median of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MEDIAN,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Mode of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.MODE,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
    {
      name: 'Standard Deviation of the Average timespent for level1 ',
      query: {
        operationType: OPERATION_TYPES.STDEV,
      },
      repeatedMeasure: REPEATED_MEASURE.mean,
      metric: {
        key: `addWorkspace${METRICS_JOIN_TEXT}level1${METRICS_JOIN_TEXT}timeSpent`,
        type: 'continuous',
        allowedData: null,
      },
      experimentId: experiments[0].id,
    },
  ];*/

  // experiment object
  const experimentObject = { ...withinSubjectExperiment, queries: metricsQueries };
  await experimentService.update(experimentObject as any, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());
  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;

  // change experiment status to Enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  const condition = experimentConditionAssignments[0].assignedCondition[0].conditionCode;

  // user 1 mark experiment point
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger(),
    experimentId,
    '1'
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // getOriginalUserDoc
  let experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());

  // log data here
  await experimentAssignmentService.dataLog(
    experimentUsers[0].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'addWorkspace',
              groupKey: 'level1',
              groupUniquifier: '1',
              attributes: {
                timeSpent: 400,
                workspaceCompletionStatus: 'GRADUATED',
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger(),
    experimentId,
    '2'
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());

  await experimentAssignmentService.dataLog(
    experimentUsers[0].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'addWorkspace',
              groupKey: 'level1',
              groupUniquifier: '2',
              attributes: {
                timeSpent: 200,
                workspaceCompletionStatus: 'PROMOTED',
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger(),
    experimentId,
    '3'
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());

  await experimentAssignmentService.dataLog(
    experimentUsers[0].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'addWorkspace',
              groupKey: 'level1',
              groupUniquifier: '3',
              attributes: {
                timeSpent: 300,
                workspaceCompletionStatus: 'GRADUATED',
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  // user 2 mark experiment point
  /*markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger(),
    experimentId,
    '4'
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());

  // log data here
  await experimentAssignmentService.dataLog(
    experimentUsers[1].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'addWorkspace',
              groupKey: 'level1',
              groupUniquifier: '4',
              attributes: {
                timeSpent: 300,
                workspaceCompletionStatus: 'PROMOTED',
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    new UpgradeLogger(),
    experimentId,
    '5'
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  // getOriginalUserDoc
  experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[1].id, new UpgradeLogger());

  await experimentAssignmentService.dataLog(
    experimentUsers[1].id,
    [
      {
        timestamp: new Date().toISOString(),
        metrics: {
          groupedMetrics: [
            {
              groupClass: 'addWorkspace',
              groupKey: 'level1',
              groupUniquifier: '5',
              attributes: {
                timeSpent: 500,
                workspaceCompletionStatus: 'GRADUATED',
              },
            },
          ],
        },
      },
    ],
    { logger: new UpgradeLogger(), userDoc: experimentUserDoc }
  );*/

  const allQuery = await queryService.find(new UpgradeLogger());
  for (let i = 0; i < allQuery.length; i++) {
    const query = allQuery[i];
    const queryResult = await queryService.analyze([query.id], new UpgradeLogger());
    let expectedValue;
    console.log('queryResult');
    console.log(queryResult);
    // Used for console output
    // const consoleString =
    //   query.metric.key === 'totalProblemsCompleted'
    //     ? query.query.operationType + ' '
    //     : query.query.operationType + ' deep';
    switch (query.query.operationType) {
      case OPERATION_TYPES.SUM: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 300;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 400;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 300;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const sum = parseInt(condition.result, 10);
        expect(sum).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.MIN: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 300;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 400;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 300;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const minValue = parseInt(condition.result, 10);

        expect(minValue).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.MAX: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 300;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 400;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 300;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const maxValue = parseInt(condition.result, 10);
        expect(maxValue).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.AVERAGE: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 300;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 400;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 300;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const Average = parseInt(condition.result, 10);
        expect(Average).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.MODE: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 300;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 400;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 300;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const Mode = parseInt(condition.result, 10);
        expect(Mode).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.MEDIAN: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 300;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 400;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 300;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const Median = parseInt(condition.result, 10);
        expect(Median).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.STDEV: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 0;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 0;
            break;
          }
          case REPEATED_MEASURE.mean: {
            expectedValue = 0;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const StdDev = parseInt(condition.result, 10);
        expect(StdDev).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.COUNT: {
        if (query.metric.type === 'categorical') {
          switch (query.repeatedMeasure) {
            case REPEATED_MEASURE.mostRecent: {
              expectedValue = 1;
              break;
            }
            case REPEATED_MEASURE.earliest: {
              expectedValue = 1;
              break;
            }
            default: {
              break;
            }
          }
        } else {
          switch (query.repeatedMeasure) {
            case REPEATED_MEASURE.mostRecent: {
              expectedValue = 1;
              break;
            }
            case REPEATED_MEASURE.earliest: {
              expectedValue = 1;
              break;
            }
            case REPEATED_MEASURE.mean: {
              expectedValue = 1;
              break;
            }
            default: {
              break;
            }
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const Count = parseInt(condition.result, 10);
        expect(Count).toEqual(expectedValue);
        break;
      }
      case OPERATION_TYPES.PERCENTAGE: {
        switch (query.repeatedMeasure) {
          case REPEATED_MEASURE.mostRecent: {
            expectedValue = 100;
            break;
          }
          case REPEATED_MEASURE.earliest: {
            expectedValue = 100;
            break;
          }
          default: {
            break;
          }
        }
        const condition = queryResult[0].mainEffect.map((condition) => {
          if (condition.conditionId === 'c22467b1-f0e9-4444-9517-cc03037bc079') {
            return condition;
          }
        });
        const Percentage = parseInt(condition.result, 10);
        expect(Percentage).toEqual(expectedValue);
        break;
      }
      default:
        break;
    }
  }
}

function makeQuery(
  metric: string,
  operationType: OPERATION_TYPES,
  experimentId: string,
  repeatedMeasure: REPEATED_MEASURE = REPEATED_MEASURE.mostRecent
): any {
  return {
    name: 'query',
    query: {
      operationType,
    },
    metric: {
      key: metric,
    },
    experimentId,
    repeatedMeasure,
  };
}
