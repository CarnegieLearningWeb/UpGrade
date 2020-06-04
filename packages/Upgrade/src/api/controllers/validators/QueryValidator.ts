import { IsJSON, IsDefined, IsString } from 'class-validator';

export class QueryValidator {
  @IsJSON()
  @IsDefined()
  public query: any;

  @IsString()
  @IsDefined()
  public metric: string;
}
