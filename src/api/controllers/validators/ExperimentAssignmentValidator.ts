import { IsNotEmpty, IsObject, IsDefined } from 'class-validator';

export class ExperimentAssignmentValidator {
    @IsNotEmpty()
    @IsDefined()
    public userId: string;

    @IsObject()
    @IsDefined()
    public userEnvironment: object;
}
