import { IsNotEmpty, IsDefined } from 'class-validator';

export class ExperimentAssignmentValidator {
    @IsNotEmpty()
    @IsDefined()
    public userId: string;
}
