import { IsNotEmpty, IsUUID, IsObject, IsDefined } from 'class-validator';

export class MarkExperimentValidator {
    @IsNotEmpty()
    @IsUUID()
    @IsDefined()
    public experimentId: string;

    @IsNotEmpty()
    @IsDefined()
    public experimentPoint: string;

    @IsNotEmpty()
    @IsDefined()
    public userId: string;

    @IsObject()
    @IsDefined()
    public userEnvironment: object;
}
