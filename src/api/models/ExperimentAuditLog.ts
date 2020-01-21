import { BaseModel } from './base/BaseModel';
import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';

@Entity()
export class ExperimentAuditLog extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public type: EXPERIMENT_LOG_TYPE;

  @Column({ type: 'json' })
  public data: object;
}
