import { Faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';
import { DecisionPoint } from '../../api/models/DecisionPoint';

export default setSeederFactory(DecisionPoint, (faker: Faker) => {
  const site = faker.word.words(1);
  const target = faker.word.words(1);
  const description = faker.word.words(4);

  const decisionPoint = new DecisionPoint();
  decisionPoint.id = crypto.randomUUID();
  decisionPoint.site = site;
  decisionPoint.target = target;
  decisionPoint.description = description;

  return decisionPoint;
});
