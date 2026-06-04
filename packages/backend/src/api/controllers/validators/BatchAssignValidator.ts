import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class BatchAssignValidator {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsString()
  public site: string;

  @Transform(({ value }) => value ?? '')
  @IsString()
  public target: string = '';

  @IsNotEmpty()
  @IsString({ each: true })
  public userIds: string[];
}
