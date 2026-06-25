import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { ExperimentUser } from '../../api/models/ExperimentUser';
import { DataSource } from 'typeorm';

export class CreateUsers implements Seeder {
  public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
    const userFactory = factoryManager.get(ExperimentUser);
    await userFactory.saveMany(10);
  }
}
