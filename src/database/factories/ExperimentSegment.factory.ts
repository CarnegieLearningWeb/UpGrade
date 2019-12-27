import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ExperimentSegment } from '../../api/models/ExperimentSegment';
import * as uuid from 'uuid';

define(ExperimentSegment, (faker: typeof Faker, settings: { experimentId: string }) => {
  const name = faker.random.words(1);
  const description = faker.random.words(4);
  const point = faker.random.words(1);

  const experimentCondition = new ExperimentSegment();
  experimentCondition.id = uuid.v4();
  experimentCondition.name = name;
  experimentCondition.description = description;
  experimentCondition.point = point;
  experimentCondition.experiment = settings.experimentId as any;

  return experimentCondition;
});
