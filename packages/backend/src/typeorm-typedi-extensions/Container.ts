import { DataSource, ObjectType } from 'typeorm';
import { getStorage } from './global';
import { getCustomRepository } from './decorators/InjectRepository';

export const Container = {
  getCustomRepository<R>(customRepository: ObjectType<R>, connectionName = 'default'): R {
    const storage = getStorage();
    const entityRepository = storage.entityRepositoriesMetadata.find((i) => i.target === customRepository);
    if (!entityRepository) {
      throw new Error(`Repository not found for ${customRepository.name}`);
    }
    const dataSourceMap = storage.dataSourcesMetadata.find((item) => item.name === connectionName);
    if (!dataSourceMap) {
      throw new Error(`DataSource not found for ${connectionName}`);
    }
    return getCustomRepository(entityRepository, dataSourceMap);
  },

  // Data source helpers
  getDataSource(connectionName = 'default'): DataSource | undefined {
    const storage = getStorage();
    return storage.dataSourcesMetadata.find((ds) => ds.name === connectionName)?.dataSource;
  },

  setDataSource(connectionName: string, dataSource: DataSource) {
    getStorage().dataSourcesMetadata.push({ name: connectionName, dataSource });
  },
};
