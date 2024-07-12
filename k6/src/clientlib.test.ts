import http from 'k6/http';
import { check, sleep } from 'k6';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { Trend, Counter } from 'k6/metrics';
import {
  UpGradeClientInterfaces,
  UpgradeClient,
  MARKED_DECISION_POINT_STATUS,
} from 'upgrade_client_lib/dist/node-lite';

import { createExperiment, deleteExperiments } from './create_experiment';

const myTrend = new Trend('waiting_time');
const hostURL = 'http://localhost:3030';
const context = 'testing';
const conditions = ['C1', 'C2'];
const partitions = [
  { site: 's1', target: 't1' },
  { site: 's2', target: 't2' },
];

const httpParams = {
  headers: {
    'Content-Type': 'application/json',
  },
};

const divCon1Counter = new Counter('condition1_counter');
const divCon2Counter = new Counter('condition2_counter');

const httpWrapper: UpGradeClientInterfaces.IHttpClientWrapper = {
  doGet: (url: string): any => {
    return http.get(url);
  },
  doPost: (url: string, body: any): any => {
    const retPost = http.post(url, JSON.stringify(body), httpParams);
    check(retPost, { 'check message': (r) => r.status == 200 });
    myTrend.add(retPost.timings.waiting);

    return JSON.parse(retPost.body as string);
  },

  doPatch: (url: string, body: any): any => {
    return http.patch(url, JSON.stringify(body));
  },
};

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    waiting_time: ['p(95)<150', 'avg<40'],
    condition1_counter: ['count>1500'],
    condition2_counter: ['count>1500'],
  },
};
export async function setup() {
  createExperiment({ context, hostURL, httpParams, conditions, partitions });
}

/**
 * Main function, this is your user. They do things.
 */
const executeUserTasks = async () => {
  const upgradeClient = new UpgradeClient(uuidv4(), hostURL, context, {
    httpClient: httpWrapper,
    clientSessionId: '12334',
  });
  await upgradeClient.init();
  const assignResponseBody = await upgradeClient.getAllExperimentConditions();

  divCon2Counter.add(
    assignResponseBody
      .map((targetSite: any) => targetSite.assignedCondition.filter((ac: any) => ac.conditionCode === conditions[0]))
      .flat().length
  );
  divCon1Counter.add(
    assignResponseBody
      .map((targetSite: any) => targetSite.assignedCondition.filter((ac: any) => ac.conditionCode === conditions[1]))
      .flat().length
  );

  const markResponseBody = await upgradeClient.markDecisionPoint(
    assignResponseBody[0].site,
    assignResponseBody[0].target,
    assignResponseBody[0].assignedCondition[0].conditionCode,
    MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
  );

  sleep(1);
};

export function teardown() {
  deleteExperiments({ hostURL, httpParams });
}
export default executeUserTasks;
