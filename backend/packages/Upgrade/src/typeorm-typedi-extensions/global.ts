import Constructable from 'typedi';
import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';

// CustomRepository with Entity and Manager
type CustomRepository<T extends ObjectLiteral> = new (target: new () => T, manager: EntityManager) => Repository<T>;

export type CustomRepositoryMetadata<T extends ObjectLiteral> =
  | {
      target: CustomRepository<T>;
      entity: T;
    }
  | { target: Constructable; entity: undefined }; // For repositories without any Entity

export type DataSourceMetadata = { name: string; dataSource: DataSource };

interface Storage {
  entityRepositoriesMetadata: CustomRepositoryMetadata<any>[];
  dataSourcesMetadata: DataSourceMetadata[];
}

const storage: Storage = {
  entityRepositoriesMetadata: [],
  dataSourcesMetadata: [],
};

export function getStorage() {
  return storage;
}
