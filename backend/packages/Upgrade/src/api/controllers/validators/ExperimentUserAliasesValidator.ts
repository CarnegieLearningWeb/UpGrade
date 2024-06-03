import { IsNotEmpty, IsDefined, IsArray, IsString } from 'class-validator';

export class ExperimentUserAliasesValidator {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsArray()
  @IsString({ each: true })
  public aliases: string[];
}
