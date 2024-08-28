import { getStorage } from '../global';

/**
 * Decorator used to mark a class as a custom entity repository.
 *
 * @param entity - The entity class associated with the repository.
 * @returns The decorated class.
 */
function EntityRepository(entity?: new (...arg: any[]) => any): ClassDecorator {
  return function (target: any) {
    // storing the entity and target in the storage
    getStorage().entityRepositoriesMetadata.push({ target, entity });
    return target;
  };
}

export { EntityRepository };
