import { IsNotEmpty, IsDefined } from 'class-validator';
import { Column } from 'typeorm';

export class ExperimentUserAliasesValidator {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsNotEmpty()
  @Column('text', { array: true })
  public aliases: string[];
}
