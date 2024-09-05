export class PropertyTypeMissingError extends Error {
  public name = 'PropertyTypeMissingError';

  constructor(object: Record<string, unknown>, propertyName: string) {
    super(
      `Cannot get reflected type for a property "${propertyName}" of ${object.constructor.name} class. ` +
        `Make sure you have turned on an "emitDecoratorMetadata": true, option in tsconfig.json ` +
        `and that you have imported "reflect-metadata" on top of the main entry file in your application.` +
        `And make sure that you have annotated the property type correctly with: ` +
        `Repository, MongoRepository, TreeRepository or custom repository class type.`
    );
  }
}
