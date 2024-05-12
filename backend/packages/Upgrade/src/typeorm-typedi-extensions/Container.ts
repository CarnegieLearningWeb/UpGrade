import { Repository, DataSource } from 'typeorm';
import { getStorage } from './global';

export const Container = {
  // Repository helper
  getRepository(repository: new () => Repository<unknown>) {
    const storage = getStorage();
    const item = storage.entityRepository.find((i) => i.target === repository);
    if (!item) {
      throw new Error(`Repository not found for ${repository.name}`);
    }
    return item.entity;
  },

  // Data source helpers
  getDataSource(connectionName: string): DataSource | undefined {
    const storage = getStorage();
    return storage.dataSource.find((ds) => ds.name === connectionName)?.dataSource;
  },
  setDataSource(connectionName: string, dataSource: DataSource) {
    getStorage().dataSource.push({ name: connectionName, dataSource });
  },
};
