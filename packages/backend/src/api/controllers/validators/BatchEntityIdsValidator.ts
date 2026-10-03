import { ArrayNotEmpty, IsArray, IsUUID, registerDecorator } from 'class-validator';
import { BatchEntityIdsRequest } from 'upgrade_types';

const HasUniqueIds = () => (object: object, propertyName: string) => {
  registerDecorator({
    name: 'arrayUnique',
    target: object.constructor,
    propertyName,
    options: { message: "All $property's elements must be unique" },
    validator: {
      validate(value: unknown) {
        if (!Array.isArray(value)) return false;
        const normalizedIds = value.map((id: unknown) => (typeof id === 'string' ? id.toLowerCase() : id));
        return new Set(normalizedIds).size === value.length;
      },
    },
  });
};

export class BatchEntityIdsValidator implements BatchEntityIdsRequest {
  @IsArray()
  @ArrayNotEmpty()
  @HasUniqueIds()
  @IsUUID('all', { each: true })
  public ids: string[];
}
