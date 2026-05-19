import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ExperimentUser } from '../../api/models/ExperimentUser';

define(ExperimentUser, (faker: typeof Faker) => {
  const id = crypto.randomUUID();
  const group: any = { class: faker.random.number(5), teacher: faker.name.firstName(), school: faker.name.findName };

  const user = new ExperimentUser();
  user.id = id;
  user.group = group;
  return user;
});
