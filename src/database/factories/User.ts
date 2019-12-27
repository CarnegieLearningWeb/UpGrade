import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { User } from '../../api/models/User';
import * as uuid from 'uuid';

define(User, (faker: typeof Faker, settings: {}) => {
  const id = uuid.v4();
  const group = { class: faker.random.number(5), teacher: faker.name.firstName(), school: faker.name.findName };

  const user = new User();
  user.id = id;
  user.group = group;
  return user;
});
