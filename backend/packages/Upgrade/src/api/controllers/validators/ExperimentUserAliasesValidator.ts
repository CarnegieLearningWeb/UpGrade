import { IsNotEmpty, IsDefined, IsArray, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class ExperimentUserAliasesValidator {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsArray()
  @IsString({ each: true })
  @Column('text', { array: true })
  public aliases: string[];
}
