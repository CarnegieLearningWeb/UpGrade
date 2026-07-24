import { setSeederFactory } from 'typeorm-extension';
import { Faker } from '@faker-js/faker';
import { Experiment } from '../../api/models/Experiment';
import {
  EXPERIMENT_STATE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  CONSISTENCY_RULE,
  IEnrollmentCompleteCondition,
} from 'upgrade_types';

export default setSeederFactory(Experiment, (faker: Faker) => {
  const name = faker.person.firstName();
  const description = faker.person.jobTitle();
  const context = ['context_identifier_1'];
  const state = faker.helpers.arrayElement([
    EXPERIMENT_STATE.CANCELLED,
    EXPERIMENT_STATE.PREVIEW,
    EXPERIMENT_STATE.ENROLLING,
    EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.SCHEDULED,
  ]);
  const startOn = state === EXPERIMENT_STATE.SCHEDULED ? faker.date.future() : undefined;

  const consistencyRule = faker.helpers.arrayElement([
    CONSISTENCY_RULE.INDIVIDUAL,
    CONSISTENCY_RULE.GROUP,
    CONSISTENCY_RULE.EXPERIMENT,
  ]);
  const assignmentUnit =
    consistencyRule === CONSISTENCY_RULE.GROUP
      ? faker.helpers.arrayElement([ASSIGNMENT_UNIT.INDIVIDUAL])
      : faker.helpers.arrayElement([ASSIGNMENT_UNIT.GROUP, ASSIGNMENT_UNIT.INDIVIDUAL]);
  const postExperimentRule = faker.helpers.arrayElement([POST_EXPERIMENT_RULE.CONTINUE, POST_EXPERIMENT_RULE.ASSIGN]);
  let enrollmentCompleteCondition: Partial<IEnrollmentCompleteCondition>;
  let endOn: Date;
  if (Math.random() < 0.5) {
    if (Math.random() < 0.5) {
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
        if (Math.random() < 0.5) {
          enrollmentCompleteCondition = {
            userCount: faker.number.int({ max: 5 }),
            groupCount: faker.number.int({ max: 3 }),
          };
        } else {
          if (Math.random() < 0.5) {
            enrollmentCompleteCondition = {
              userCount: faker.number.int({ max: 5 }),
            };
          } else {
            enrollmentCompleteCondition = {
              groupCount: faker.number.int({ max: 3 }),
            };
          }
        }
      } else {
        enrollmentCompleteCondition = {
          userCount: faker.number.int({ max: 5 }),
        };
      }
    } else {
      endOn = faker.date.future();
    }
  }

  const tags = [];
  for (let i = 0; i < faker.number.int({ max: 10 }); i++) {
    tags.push(faker.person.firstName());
  }
  const group =
    assignmentUnit === ASSIGNMENT_UNIT.GROUP ? faker.helpers.arrayElement(['class', 'teacher', 'school']) : undefined;

  const experiment = new Experiment();
  experiment.id = crypto.randomUUID();
  experiment.name = name;
  experiment.context = context;
  experiment.description = description;
  experiment.state = state;
  experiment.backendVersion = '6.6.0';
  if (startOn) {
    experiment.startOn = startOn;
  }
  experiment.consistencyRule = consistencyRule;
  experiment.assignmentUnit = assignmentUnit;
  experiment.postExperimentRule = postExperimentRule;
  if (enrollmentCompleteCondition) {
    experiment.enrollmentCompleteCondition = enrollmentCompleteCondition;
  }
  if (endOn) {
    experiment.endOn = endOn;
  }
  experiment.tags = tags;
  if (group) {
    experiment.group = group;
  }

  return experiment;
});
