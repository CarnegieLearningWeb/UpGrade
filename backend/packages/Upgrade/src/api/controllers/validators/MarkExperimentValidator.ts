import { IsNotEmpty, IsDefined } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export class MarkExperimentValidator {
  public partitionId: string | undefined;

  @IsNotEmpty()
  @IsDefined()
  public experimentPoint: string;

  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsNotEmpty()
  @IsDefined()
  public condition: string | null;

  @IsNotEmpty()
  @IsDefined()
  public status: MARKED_DECISION_POINT_STATUS;
}
