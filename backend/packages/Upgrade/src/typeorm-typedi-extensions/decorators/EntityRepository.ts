import { getStorage } from '../global';

/**
 * Decorator used to mark a class as a custom entity repository.
 *
 * @param entity - The entity class associated with the repository.
 * @returns The decorated class.
 */
function EntityRepository(entity): ClassDecorator {
  return function (target: any) {
    // storing the entity and target in the storage
    getStorage().entityRepository.push({ target, entity });
    return target;
  };
}

export { EntityRepository };
