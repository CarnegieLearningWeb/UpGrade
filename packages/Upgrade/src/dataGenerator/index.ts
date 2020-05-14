import mocker from 'mocker-data-generator';
import * as faker from 'faker';
import fs from 'fs';

import {
    CONSISTENCY_RULE,
    ASSIGNMENT_UNIT,
    POST_EXPERIMENT_RULE,
    EXPERIMENT_STATE
} from 'upgrade_types';

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

const partition = {
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

const experiment = {
    name: {
        faker: 'random.words(2)',
    },
    description: {
        faker: 'lorem.sentence',
    },
    consistencyRule: {
        function: (): any => {
            return faker.random.objectElement(CONSISTENCY_RULE);
        },
    },
    assignmentUnit: {
        function: (): any => {
            return faker.random.objectElement(ASSIGNMENT_UNIT);
        },
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
            length: 3,
            fixedLength: false,
        },
    ],
    endOn: {
        function: () => {
            return 'undefined';
        },
    },
    enrollmentCompleteCondition: {
        function: () => {
            return 'undefined';
        },
    },
    startOn: {
        function: () => {
            return 'undefined';
        },
    },
    postExperimentRule: {
        function: (): any => {
            return faker.random.objectElement(POST_EXPERIMENT_RULE);
        },
    },
    state: {
        function: (): any => {
            return faker.random.objectElement(EXPERIMENT_STATE);
        },
    },
    revertTo: {
        function: () => {
            return 'default';
        },
    },
};

//  partitions must be 4 times the experiments created
mocker()
    .schema('partition', partition, { uniqueField: ['expPoint', 'expId'], min: 200, max: 300 })
    .schema('experiment', experiment, { uniqueField: 'partition.expId', min: 50, max: 50 })
    .build()
    .then(
        data => {
            const partitions = data.partition;
            const experiments = data.experiment.map((exp: any) => {
                // Change the condition assignment weight
                const conditions = exp.conditions.map((element: any) => {
                    return {
                        ...element,
                        assignmentWeight: 100 / exp.conditions.length,
                    };
                });
                // add the partitions.
                const currPartitions = [];
                for (let i = 0; i < faker.random.number({ min: 1, max: 4 }); i++) {
                    const splicingIndex = faker.random.number({ min: 0, max: partitions.length - 1 });
                    currPartitions.push(partitions.splice(splicingIndex, 1)[0]);
                }

                return { ...exp, conditions, partitions: currPartitions };
            });
            fs.writeFile('experiments.json', JSON.stringify(experiments), (err) => {
                if (err) { throw err; }
                console.log('complete');
            });
        },
        err => console.error(err)
    );
