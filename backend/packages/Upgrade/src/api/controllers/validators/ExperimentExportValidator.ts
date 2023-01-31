import { IsNotEmpty, IsDefined, IsString, IsArray } from 'class-validator';

export class ExperimentExportValidator {
    @IsString()
    @IsNotEmpty()
    @IsDefined()
    @IsArray()
    public experimentIds: string[];

}
