import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import * as uuid from 'uuid';
import { ExperimentCondition } from '../../api/models/ExperimentCondition';

define(ExperimentCondition, (faker: typeof Faker, settings: { experimentId: string }) => {
  const name = faker.random.words(1);
  const description = faker.random.words(4);
  const assignmentWeight = Math.random();
  const conditionCode = faker.random.alphaNumeric(1);

  const experimentCondition = new ExperimentCondition();
  experimentCondition.id = uuid.v4();
  experimentCondition.name = name;
  experimentCondition.description = description;
  experimentCondition.assignmentWeight = assignmentWeight;
  experimentCondition.conditionCode = conditionCode;
  experimentCondition.experiment = settings.experimentId as any;

  return experimentCondition;
});
