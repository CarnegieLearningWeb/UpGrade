import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ExperimentUser } from '../../api/models/ExperimentUser';
import * as uuid from 'uuid';

define(ExperimentUser, (faker: typeof Faker) => {
  const id = uuid.v4();
  const group = { class: faker.random.number(5), teacher: faker.name.firstName(), school: faker.name.findName };

  const user = new ExperimentUser();
  user.id = id;
  user.group = group;
  return user;
});
