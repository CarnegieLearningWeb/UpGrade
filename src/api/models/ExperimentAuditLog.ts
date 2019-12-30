import { BaseModel } from './base/BaseModel';
import { PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

enum EXPERIMENT_LOG_TYPE {
  EXPERIMENT_CREATED = 'experimentCreated',
  EXPERIMENT_UPDATED = 'experimentUpdated',
}

export class ExperimentAuditLog extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public type: EXPERIMENT_LOG_TYPE;

  @Column()
  public data: any;
}
