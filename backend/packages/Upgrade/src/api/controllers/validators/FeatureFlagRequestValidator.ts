import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export type IGetAllFeatureFlagsRequestBody =
  | {
      context: string;
    }
  | {
      context: string;
      groupsForSession: Record<string, string[]>;
      includeStoredUserGroups: boolean;
    };

// Custom validation decorator to ensure both session properties are provided together
const BothSessionPropertiesRequired = (validationOptions?: ValidationOptions) => {
  const registerBothSessionPropertiesRequired = (object: object, propertyName: string) => {
    registerDecorator({
      name: 'bothSessionPropertiesRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const hasProvideGroups = obj.groupsForSession !== undefined;
          const hasIncludeStored = obj.includeStoredUserGroups !== undefined;

          // Both must be provided together, or neither
          return (hasProvideGroups && hasIncludeStored) || (!hasProvideGroups && !hasIncludeStored);
        },
        defaultMessage() {
          return 'Both groupsForSession and includeStoredUserGroups must be provided together, or neither should be provided';
        },
      },
    });
  };

  return registerBothSessionPropertiesRequired;
};

export class FeatureFlagRequestValidator {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsOptional()
  @IsObject()
  @BothSessionPropertiesRequired()
  public groupsForSession?: Record<string, string[]>;

  @IsOptional()
  @IsBoolean()
  @BothSessionPropertiesRequired()
  public includeStoredUserGroups?: boolean;
}
