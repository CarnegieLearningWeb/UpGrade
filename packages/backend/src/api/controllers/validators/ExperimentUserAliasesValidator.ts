import { IsArray, IsString } from 'class-validator';

export class ExperimentUserAliasesValidatorv6 {
  @IsArray()
  @IsString({ each: true })
  public aliases: string[];
}
