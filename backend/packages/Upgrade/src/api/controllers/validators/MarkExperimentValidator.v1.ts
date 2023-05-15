import { IsNotEmpty, IsDefined } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export class MarkExperimentValidator {
  public target: string | undefined;

  @IsNotEmpty()
  @IsDefined()
  public site: string;

  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsNotEmpty()
  @IsDefined()
  public condition: string | null;

  public experimentId: string | null;

  public status?: MARKED_DECISION_POINT_STATUS;
}