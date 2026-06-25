import { Faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';
import { ExperimentUser } from '../../api/models/ExperimentUser';

export default setSeederFactory(ExperimentUser, (faker: Faker) => {
  const id = crypto.randomUUID();
  const group: any = {
    class: faker.number.int({ max: 5 }),
    teacher: faker.person.firstName(),
    school: faker.person.firstName(),
  };

  const user = new ExperimentUser();
  user.id = id;
  user.group = group;
  return user;
});
