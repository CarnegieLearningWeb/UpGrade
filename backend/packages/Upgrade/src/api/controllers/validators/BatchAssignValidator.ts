import { IsNotEmpty } from 'class-validator';
import { IsString } from 'class-validator';

export class BatchAssignValidator {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsString()
  public site: string;

  @IsNotEmpty()
  @IsString()
  public target: string;

  @IsNotEmpty()
  @IsString({ each: true })
  public userIds: string[];
}
