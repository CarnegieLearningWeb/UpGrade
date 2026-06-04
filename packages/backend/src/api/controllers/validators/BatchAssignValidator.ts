import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsString } from 'class-validator';

export class BatchAssignValidator {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsString()
  public site: string;

  @IsOptional()
  public target?: string | null;

  @IsNotEmpty()
  @IsString({ each: true })
  public userIds: string[];
}
