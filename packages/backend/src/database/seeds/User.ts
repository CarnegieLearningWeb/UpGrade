import { Factory, Seeder } from 'typeorm-seeding';
import { ExperimentUser } from '../../api/models/ExperimentUser';

export class CreateUsers implements Seeder {
  public async run(factory: Factory): Promise<any> {
    await factory(ExperimentUser)().seedMany(10);
  }
}
