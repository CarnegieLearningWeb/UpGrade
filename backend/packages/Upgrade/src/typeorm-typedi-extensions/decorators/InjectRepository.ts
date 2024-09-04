import { CustomRepositoryMetadata, DataSourceMetadata } from './../global';
import { Container } from 'typedi';
import { getStorage } from '../global';
import { PropertyTypeMissingError } from '../errors/property-type-missing.error';
import { ParamTypeMissingError } from '../errors/param-type-missing.error';
import { Repository } from 'typeorm';

/**
 * Decorator used to inject a repository instance into a class property or constructor parameter.
 * @param connectionName The name of the connection to use. Defaults to 'default'.
 * @returns A property decorator or parameter decorator function.
 * @throws Error if reflect-metadata is not available.
 * @throws ParamTypeMissingError if the decorator is applied to a constructor parameter and the parameter type is missing.
 * @throws PropertyTypeMissingError if the decorator is applied to a class property and the property type is missing.
 */
export function InjectRepository(connectionName = 'default'): PropertyDecorator | ParameterDecorator {
  return function (object: any, propertyName: string | symbol, index?: number) {
    // throw error if reflect-metadata is not available
    if (Reflect?.getOwnMetadata == undefined) {
      throw new Error('Reflect.getOwnMetadata is not defined. Make sure to import the `reflect-metadata` package!');
    }

    let repositoryType: unknown;

    if (index !== undefined) {
      /** The decorator has been applied to a constructor parameter. */
      // eslint-disable-next-line @typescript-eslint/ban-types
      const paramTypes: Function[] | undefined = Reflect.getOwnMetadata('design:paramtypes', object, propertyName);
      if (!paramTypes || !paramTypes[index]) {
        throw new ParamTypeMissingError(object, propertyName as string, index);
      }

      repositoryType = paramTypes[index];
    } else {
      // Get the type of the the property name via reflection
      // eslint-disable-next-line @typescript-eslint/ban-types
      const propertyType: Function | undefined = Reflect.getOwnMetadata('design:type', object, propertyName);
      if (!propertyType) {
        throw new PropertyTypeMissingError(object, propertyName as string);
      }
      repositoryType = propertyType;
    }

    Container.registerHandler({
      object,
      propertyName: propertyName as string,
      index,
      value: () => {
        const storage = getStorage();
        const dataSourceMap = storage.dataSourcesMetadata.find((item) => item.name === connectionName);
        if (!dataSourceMap) {
          throw new Error(`DataSource not found for ${connectionName}`);
        }
        const entityRepository = storage.entityRepositoriesMetadata.find(
          (item) => item.target === (repositoryType as unknown)
        );
        if (!entityRepository) {
          throw new Error(`Repository not found for ${repositoryType}`);
        }
        return getCustomRepository(entityRepository, dataSourceMap);
      },
    });
  };
}

export function getCustomRepository<T>(
  entityRepository: CustomRepositoryMetadata<T>,
  dataSourceMap: DataSourceMetadata
): Repository<T> | any {
  const instance = new entityRepository.target(entityRepository?.entity as any, dataSourceMap.dataSource.manager);
  const methodDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(instance));
  const methods = Object.fromEntries(
    Object.entries(methodDescriptors)
      .filter(([, value]) => typeof value.value === 'function')
      .map(([key, value]) => [key, value.value])
  );
  let repository: Repository<any>;
  if (entityRepository.entity) {
    repository = dataSourceMap.dataSource.getRepository(entityRepository.entity as any).extend(methods);
  } else {
    repository = instance;
  }
  return repository;
}
