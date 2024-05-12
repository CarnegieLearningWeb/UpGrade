import { DataSource, Repository } from 'typeorm';

interface Storage {
  entityRepository: Array<{ target: new () => Repository<unknown>; entity: unknown }>;
  dataSource: Array<{ name: string; dataSource: DataSource }>;
}

const storage: Storage = {
  entityRepository: [],
  dataSource: [],
};

export function getStorage() {
  return storage;
}
