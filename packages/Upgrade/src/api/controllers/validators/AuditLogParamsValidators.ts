import { IsNumber, IsNotEmpty } from 'class-validator';
import { Column } from 'typeorm';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';
export class AuditLogParamsValidator {
    @IsNumber()
    @IsNotEmpty()
    public skip: number;

    @IsNumber()
    @IsNotEmpty()
    public take: number;

    @Column({ nullable: true })
    public filter: EXPERIMENT_LOG_TYPE;
}
