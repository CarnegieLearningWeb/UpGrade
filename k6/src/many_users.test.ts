import http from 'k6/http';
import { sleep } from 'k6';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

import { createExperiment, deleteExperiments } from './create_experiment';

const hostURL = 'http://localhost:3030';
const context = 'testing';
const conditions = ['C1', 'C2'];
const partitions = [
  { site: 's1', target: 't1' },
  { site: 's2', target: 't2' },
];
const uids: string[] = [];
const httpParams = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export const options = {
  // Key configurations for avg load test in this section
  scenarios: {
    clients: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10m', target: 100 }, // traffic ramp-up from 1 to 100 users over 5 minutes.
        { duration: '30m', target: 100 }, // stay at 100 users for 30 minutes
        { duration: '5m', target: 0 }, // ramp-down to 0 users
      ],
    },
    batchLogs: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 200 },
        { duration: '3m', target: 300 },
        { duration: '1m', target: 0 },
      ],
      startTime: '13m',
    },
  },
};

export async function setup() {
  createExperiment({ context, hostURL, httpParams, conditions, partitions });
}

export default () => {
  const uid = uuidv4();
  uids.push(uid);
  const initBody = { id: uid };
  const initRes = http.post(`${hostURL}/api/v5/init`, JSON.stringify(initBody), {
    ...httpParams,
    tags: { init_call: 'Call to /init' },
  });
  sleep(1);

  const workingGroupBody = {
    id: uid,
    workingGroup: {
      class: 'class1',
    },
  };
  const workingGroupRes = http.patch(`${hostURL}/api/v5/workinggroup`, JSON.stringify(workingGroupBody), {
    ...httpParams,
    tags: { working_group_call: 'Call to /workinggroup' },
  });
  sleep(1);

  const userAliasBody = {
    userId: uid,
    aliases: [uid + 'class1'],
  };
  const userAliaspRes = http.patch(`${hostURL}/api/v5/useraliases`, JSON.stringify(userAliasBody), {
    ...httpParams,
    tags: { user_alias_call: 'Call to /useraliases' },
  });
  sleep(1);

  const assignBody = {
    userId: uid,
    context,
  };
  const assignRes = http.post(`${hostURL}/api/v5/assign`, JSON.stringify(assignBody), {
    ...httpParams,
    tags: { assign_call: 'Call to /assign' },
  });
  const assignRespJSON: any = assignRes.json();

  sleep(1);

  const markBody = {
    userId: uid,
    data: {
      site: assignRespJSON[0].site,
      target: assignRespJSON[0].target,
      assignedCondition: {
        conditionCode: assignRespJSON[0].assignedCondition[0].conditionCode,
      },
    },
  };
  const markRes = http.post(`${hostURL}/api/v5/mark`, JSON.stringify(markBody), {
    ...httpParams,
    tags: { mark_call: 'Call to /mark' },
  });
  sleep(1);

  const logBody = {
    userId: uid,
    value: [
      {
        timestamp: Date(),
        metrics: {
          attributes: {
            totalTimeSeconds: 5,
          },
        },
      },
    ],
  };
  const logRes = http.post(`${hostURL}/api/log`, JSON.stringify(logBody), {
    ...httpParams,
    tags: { log_call: 'Call to /log from client' },
  });
};

export function batchLogs() {
  if (uids.length > 0) {
    const logBody = {
      userId: uids.shift(),
      value: [
        {
          timestamp: Date(),
          metrics: {
            attributes: {
              totalTimeSeconds: 5,
            },
          },
        },
      ],
    };
    const logRes = http.post(`${hostURL}/api/log`, JSON.stringify(logBody), {
      ...httpParams,
      tags: { log_call: 'Call to /log from batch' },
    });
  }
}

export function teardown() {
  deleteExperiments({ hostURL, httpParams });
}
