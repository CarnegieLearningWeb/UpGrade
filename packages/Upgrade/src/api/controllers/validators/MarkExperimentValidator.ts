import { IsNotEmpty, IsDefined } from 'class-validator';

export class MarkExperimentValidator {
  public partitionId: string | undefined;

  @IsNotEmpty()
  @IsDefined()
  public experimentPoint: string;

  @IsNotEmpty()
  @IsDefined()
  public userId: string;
}
