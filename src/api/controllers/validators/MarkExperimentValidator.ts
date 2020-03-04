import { IsNotEmpty, IsDefined, IsString } from 'class-validator';

export class MarkExperimentValidator {
  @IsNotEmpty()
  @IsString()
  @IsDefined()
  public experimentId: string;

  @IsNotEmpty()
  @IsDefined()
  public experimentPoint: string;

  @IsNotEmpty()
  @IsDefined()
  public userId: string;
}
