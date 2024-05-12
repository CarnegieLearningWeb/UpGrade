import { Container } from 'typedi';
import { getStorage } from '../global';

/**
 * Decorator function that injects a data source into a property or parameter.
 * @param connectionName The name of the data source connection. Defaults to 'default'.
 * @returns A property decorator or parameter decorator function.
 */
export function InjectDataSource(connectionName = 'default'): PropertyDecorator | ParameterDecorator {
  return function (object: any, propertyName: string | symbol, index?: number) {
    Container.registerHandler({
      object,
      propertyName: propertyName as string,
      index,
      value: () => {
        const storage = getStorage();
        return storage.dataSource.find((ds) => ds.name === connectionName)?.dataSource;
      },
    });
  };
}
