import { Faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';
import { ExperimentCondition } from '../../api/models/ExperimentCondition';

export default setSeederFactory(ExperimentCondition, (faker: Faker) => {
  const name = faker.word.words(1);
  const description = faker.word.words(4);
  const assignmentWeight = Math.random();
  const conditionCode = faker.string.alphanumeric(1);
  const twoCharacterId = faker.string.alphanumeric(2);

  const experimentCondition = new ExperimentCondition();
  experimentCondition.id = crypto.randomUUID();
  experimentCondition.name = name;
  experimentCondition.description = description;
  experimentCondition.assignmentWeight = assignmentWeight;
  experimentCondition.conditionCode = conditionCode;
  experimentCondition.twoCharacterId = twoCharacterId;

  return experimentCondition;
});
