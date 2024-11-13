import http from 'k6/http';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const EXPERIMENT_NAME_PREFIX = 'K6 Load Test';
export async function createExperiment(experimentParams) {
  const { hostURL, httpParams, context, conditions, partitions } = experimentParams;

  const experimentData = JSON.stringify({
    name: `${EXPERIMENT_NAME_PREFIX} ${(Math.random() + 1).toString(36).substring(2)}`,
    consistencyRule: 'individual',
    assignmentUnit: 'individual',
    postExperimentRule: 'continue',
    state: 'enrolling',
    tags: ['LoadTest'],
    context: [context],
    filterMode: 'includeAll',
    type: 'Simple',
    conditions: conditions.map((condition, index) => {
      return { id: uuidv4(), name: condition, assignmentWeight: 50, conditionCode: condition, order: index + 1 };
    }),
    partitions: partitions.map((partition, index) => {
      return {
        id: uuidv4(),
        site: partition.site,
        target: partition.target,
        order: index + 1,
        excludeIfReached: false,
      };
    }),
    queries: [
      {
        versionNumber: 1,
        name: 'TTS',
        query: {
          operationType: 'sum',
        },
        repeatedMeasure: 'MOST RECENT',
        metric: {
          versionNumber: 1,
          key: 'totalTimeSeconds',
          type: 'continuous',
          allowedData: null,
        },
      },
    ],
    experimentSegmentInclusion: {
      segment: {
        type: 'private',
        groupForSegment: [
          {
            groupId: 'All',
            type: 'All',
          },
        ],
      },
    },
    experimentSegmentExclusion: {
      segment: {
        type: 'private',
      },
    },
  });
  http.post(`${hostURL}/api/experiments`, experimentData, httpParams);
}

export async function deleteExperiments(experimentParams) {
  const { hostURL, httpParams } = experimentParams;

  const expNamesResp = await http.get(`${hostURL}/api/experiments/names`, httpParams);
  const expRespJSON: any = expNamesResp.json();
  const experimentIds = expRespJSON.filter((exp) => exp.name.startsWith(EXPERIMENT_NAME_PREFIX)).map((exp) => exp.id);
  experimentIds.forEach((experimentId) => http.del(`${hostURL}/api/experiments/${experimentId}`, httpParams));
}
