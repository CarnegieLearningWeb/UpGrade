import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { DecisionPoint } from '../../api/models/DecisionPoint';
import * as uuid from 'uuid';

define(DecisionPoint, (faker: typeof Faker, settings: { experimentId: string }) => {
  const name = faker.random.words(1);
  const description = faker.random.words(4);
  const point = faker.random.words(1);

  const experimentCondition = new DecisionPoint();
  experimentCondition.id = uuid.v4();
  experimentCondition.target = name;
  experimentCondition.description = description;
  experimentCondition.site = point;
  experimentCondition.experiment = settings.experimentId as any;

  return experimentCondition;
});
