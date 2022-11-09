import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import * as uuid from 'uuid';
import { Experiment } from '../../api/models/Experiment';
import {
  EXPERIMENT_STATE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  CONSISTENCY_RULE,
  IEnrollmentCompleteCondition,
} from 'upgrade_types';

define(Experiment, (faker: typeof Faker) => {
  const name = faker.name.firstName();
  const description = faker.name.jobTitle();
  const state = faker.random.arrayElement([
    EXPERIMENT_STATE.CANCELLED,
    EXPERIMENT_STATE.PREVIEW,
    EXPERIMENT_STATE.ENROLLING,
    EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.SCHEDULED,
  ]);
  const startOn = state === EXPERIMENT_STATE.SCHEDULED ? faker.date.future() : undefined;

  const consistencyRule = faker.random.arrayElement([
    CONSISTENCY_RULE.INDIVIDUAL,
    CONSISTENCY_RULE.GROUP,
    CONSISTENCY_RULE.EXPERIMENT,
  ]);
  const assignmentUnit =
    consistencyRule === CONSISTENCY_RULE.GROUP
      ? faker.random.arrayElement([ASSIGNMENT_UNIT.INDIVIDUAL])
      : faker.random.arrayElement([ASSIGNMENT_UNIT.GROUP, ASSIGNMENT_UNIT.INDIVIDUAL]);
  const postExperimentRule = faker.random.arrayElement([POST_EXPERIMENT_RULE.CONTINUE, POST_EXPERIMENT_RULE.ASSIGN]);
  let enrollmentCompleteCondition: Partial<IEnrollmentCompleteCondition>;
  let endOn: Date;
  if (Math.random() < 0.5) {
    if (Math.random() < 0.5) {
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
        if (Math.random() < 0.5) {
          enrollmentCompleteCondition = {
            userCount: faker.random.number(5),
            groupCount: faker.random.number(3),
          };
        } else {
          if (Math.random() < 0.5) {
            enrollmentCompleteCondition = {
              userCount: faker.random.number(5),
            };
          } else {
            enrollmentCompleteCondition = {
              groupCount: faker.random.number(3),
            };
          }
        }
      } else {
        enrollmentCompleteCondition = {
          userCount: faker.random.number(5),
        };
      }
    } else {
      endOn = faker.date.future();
    }
  }

  const tags = [];
  for (let i = 0; i < faker.random.number(10); i++) {
    tags.push(faker.name.firstName());
  }
  const group = ASSIGNMENT_UNIT.GROUP ? faker.random.arrayElement(['class', 'teacher', 'school']) : undefined;

  const experiment = new Experiment();
  experiment.id = uuid.v4();
  experiment.name = name;
  experiment.description = description;
  experiment.state = state;
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
