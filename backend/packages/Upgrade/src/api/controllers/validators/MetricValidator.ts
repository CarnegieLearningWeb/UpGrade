import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, ValidationOptions, registerDecorator } from 'class-validator';
import { IMetricMetaData } from 'upgrade_types';

const IsMetricUnit = (validationOptions?: ValidationOptions) => {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'validateMetricUnit',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'The MetricUnit array is not a valid ISingleMetric or IGroupMetric',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return validateMetricUnit(value)
        },
      },
    });
  };
};

function validateMetricUnit(data: unknown) {
  if (Array.isArray(data) && data.every(isValidMetric)) {
    return true
  } else {
    return false
  }
};

function isValidMetric(value: any): value is IGroupMetric | ISingleMetric {
  if ('groupClass' in value) {
    return (
      typeof value.groupClass === 'string' &&
      value.groupClass.trim().length > 0 &&
      Array.isArray(value.allowedKeys) &&
      value.allowedKeys.every((key) => typeof key === 'string' && key.trim().length > 0) &&
      Array.isArray(value.attributes) &&
      value.attributes.every(isValidMetric)
    );
  } else if ('metric' in value) {
    return (
      typeof value.metric === 'string' &&
      value.metric.trim().length > 0 &&
      typeof value.datatype === 'string' &&
      value.datatype.trim().length > 0 &&
      Object.values(IMetricMetaData).includes(value.datatype) &&
      (value.allowedValues === undefined ||
        (Array.isArray(value.allowedValues) &&
          value.allowedValues.every(
            (allowedValue) =>
              typeof allowedValue === 'string' ||
              typeof allowedValue === 'number'
          )))
    );
  }
  return false;
}

class ISingleMetric {
  @IsString()
  @IsNotEmpty()
  metric: string;

  @IsNotEmpty()
  @IsEnum(IMetricMetaData)
  datatype: IMetricMetaData;

  @IsOptional()
  @IsArray({each: true})
  allowedValues?: (string | number)[];
}

class IGroupMetric {
  @IsString()
  groupClass: string;

  @IsArray()
  @IsString({each: true})
  allowedKeys: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @IsNotEmpty({ each: true })
  attributes: (IGroupMetric | ISingleMetric)[];
}

export class MetricValidator {
  @IsArray()
  @IsNotEmpty()
  @IsMetricUnit()
  metricUnit: (ISingleMetric | IGroupMetric)[];
}
