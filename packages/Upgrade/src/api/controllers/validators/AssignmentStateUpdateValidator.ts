import { IsNotEmpty, IsDefined, IsUUID, IsEnum } from 'class-validator';
import { EXPERIMENT_STATE } from 'ees_types';

export class AssignmentStateUpdateValidator {
    @IsNotEmpty()
    @IsUUID()
    @IsDefined()
    public experimentId: string;

    @IsDefined()
    @IsEnum(EXPERIMENT_STATE)
    public state: EXPERIMENT_STATE;
}
