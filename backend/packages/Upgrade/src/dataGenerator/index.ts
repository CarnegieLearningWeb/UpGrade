import mocker from 'mocker-data-generator';
import fetch from 'node-fetch';
import * as faker from 'faker';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE } from 'upgrade_types';

const context = [
  'App',
  'Addition',
  'Subtraction',
  'Multiplication',
  'Division',
  'Addition Simple',
  'Subtraction Simple',
  'Multiplication Simple',
  'Division Simple',
];
const groups = ['class', 'school', 'district'];
const numberOfCond = [1, 2, 4, 5];

// Define decision point schema generator
const decisionPoint = {
  expPoint: {
    faker: 'random.word()',
  },
  expId: {
    faker: 'random.word()',
  },
  description: {
    faker: 'lorem.sentence()',
  },
};

// Define experiement schema generator
const experiment = {
  name: {
    faker: 'random.words(2)',
  },
  description: {
    faker: 'lorem.sentence',
  },
  consistencyRule: {
    function: (): string => {
      return faker.random.objectElement(CONSISTENCY_RULE);
    },
  },
  assignmentUnit: {
    function: (): string => {
      return faker.random.objectElement(ASSIGNMENT_UNIT);
    },
  },
  'object.consistencyRule=="group",assignmentUnit': {
    static: 'group',
  },
  tags: [
    {
      function: (): any => {
        return faker.random.arrayElement(context);
      },
      length: 3,
      fixedLength: false,
    },
  ],
  context: [
    {
      function: (): any => {
        return faker.random.arrayElement(context);
      },
      length: 2,
      fixedLength: false,
    },
  ],
  conditions: [
    {
      function: () => {
        return {
          id: faker.random.uuid(),
          conditionCode: faker.random.word(),
          assignmentWeight: faker.random.number(),
          description: faker.lorem.sentence(),
          name: faker.random.words(3),
        };
      },
      length: faker.random.arrayElement(numberOfCond),
      fixedLength: true,
    },
  ],
  endOn: {
    function: () => {
      return null;
    },
  },
  enrollmentCompleteCondition: {
    function: () => {
      return null;
    },
  },
  startOn: {
    function: () => {
      return null;
    },
  },
  postExperimentRule: {
    function: (): string => {
      return faker.random.objectElement(POST_EXPERIMENT_RULE);
    },
  },
  state: {
    function: (): string => {
      return 'enrolling';
    },
  },
  revertTo: {
    function: () => {
      return null;
    },
  },
};

//  decision points must be 4 times the experiments created
const generateFakeExperiments = async (numberOfAssignemts: number, host: string) => {
  const data = await mocker()
    .schema('partition', decisionPoint, {
      uniqueField: ['expPoint', 'expId'],
      min: numberOfAssignemts * 4,
      max: numberOfAssignemts * 5,
    })
    .schema('experiment', experiment, {
      uniqueField: 'partition.expId',
      min: numberOfAssignemts,
      max: numberOfAssignemts,
    })
    .build();

  const decisionPoints = data.partition;
  const experiments = data.experiment.map((exp: any) => {
    const group = exp.consistencyRule === 'group' ? groups[faker.random.number({ min: 1, max: 4 })] : null;
    // Change the condition assignment weight
    const conditions = exp.conditions.map((element: any) => {
      return {
        ...element,
        assignmentWeight: 100 / exp.conditions.length,
      };
    });
    // add the decision points.
    const currDecisionPoints = [];
    for (let i = 0; i < faker.random.number({ min: 1, max: 4 }); i++) {
      const splicingIndex = faker.random.number({ min: 0, max: decisionPoints.length - 1 });
      currDecisionPoints.push(decisionPoints.splice(splicingIndex, 1)[0]);
    }

    return { ...exp, group, conditions, partitions: currDecisionPoints };
  });
  try {
    const response = await fetch(host, {
      body: JSON.stringify(experiments),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('batch experiments => ', await response.json());
    process.exit(0);
  } catch (error) {
    console.log('Error generating batch experiments => ', error);
    process.exit(1);
  }
};

const n = parseInt(process.argv[2], 10);
const url = process.argv[3];

if (typeof n === 'undefined' || typeof url === 'undefined') {
  console.log('Error: Please provide host URL and number of experiment to generate');
  process.exit(1);
}

generateFakeExperiments(n, url);
