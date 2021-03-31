import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm/connection/Connection';
import { ExperimentUser } from '../../api/models/ExperimentUser';

export class CreateUsers implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await factory(ExperimentUser)().seedMany(10);
  }
}
