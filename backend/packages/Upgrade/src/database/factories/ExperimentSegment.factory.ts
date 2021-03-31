import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ExperimentPartition } from '../../api/models/ExperimentPartition';
import * as uuid from 'uuid';

define(ExperimentPartition, (faker: typeof Faker, settings: { experimentId: string }) => {
  const name = faker.random.words(1);
  const description = faker.random.words(4);
  const point = faker.random.words(1);

  const experimentCondition = new ExperimentPartition();
  experimentCondition.id = uuid.v4();
  experimentCondition.expId = name;
  experimentCondition.description = description;
  experimentCondition.expPoint = point;
  experimentCondition.experiment = settings.experimentId as any;

  return experimentCondition;
});
