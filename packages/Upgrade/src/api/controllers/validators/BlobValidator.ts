import { IsNotEmpty, IsDefined, IsString, IsJSON } from 'class-validator';
import { ILogInput } from 'upgrade_types';

export class BlobValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public userId: string;

  @IsJSON()
  @IsDefined()
  @IsNotEmpty()
  public value: ILogInput;
}
