import { IsNotEmpty, IsArray, IsString } from 'class-validator';

export class ExperimentUserAliasesValidatorv6 {
  @IsArray()
  @IsString({ each: true })
  public aliases: string[];
}

export class ExperimentUserAliasesValidator extends ExperimentUserAliasesValidatorv6 {
  @IsNotEmpty()
  public userId: string;
}
