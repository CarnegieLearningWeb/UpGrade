import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsString, ValidateNested, IsArray, IsOptional, IsObject, ValidationOptions, isObject, registerDecorator } from 'class-validator';

const IsLogAttributesRecord = (validationOptions?: ValidationOptions) => {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsLogAttributesRecord',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'The Attributes is not a valid Record<string, string | number>',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!isObject(value)) return false;
          if (Object.keys(value).length === 0) return true;

          const keys = Object.keys(value);

          return keys.every((key) => {
            if (typeof key !== 'string' || key === '') return false;
            if (value[key] === '') return false;
            if (typeof value[key] !== 'string' && typeof value[key] !== 'number') return false;

            return true;
          });
        },
      },
    });
  };
};

class ILogGroupMetrics {
  @IsString()
  @IsNotEmpty()
  groupClass: string;

  @IsString()
  @IsNotEmpty()
  groupKey: string;

  @IsString()
  @IsNotEmpty()
  groupUniquifier: string;

  @IsOptional()
  @IsLogAttributesRecord()
  attributes?: Record<string, string | number>;
}

class ILogMetrics {
  @IsOptional()
  @IsLogAttributesRecord()
  attributes?: Record<string, string | number>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ILogGroupMetrics)
  groupedMetrics: ILogGroupMetrics[];
}

class ILogInput {
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ILogMetrics)
  metrics: ILogMetrics;
}

export class LogValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public userId: string;

  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ILogInput)
  public value: ILogInput[];
}
