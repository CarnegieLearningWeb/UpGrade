import { IsNotEmpty, IsDefined, IsString } from 'class-validator';

export class BlobValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public userId: string;

  @IsDefined()
  @IsNotEmpty()
  public value: string;
}
