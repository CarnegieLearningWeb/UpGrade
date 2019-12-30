import { BaseModel } from './base/BaseModel';
import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

export enum EXPERIMENT_LOG_TYPE {
  EXPERIMENT_CREATED = 'experimentCreated',
  EXPERIMENT_UPDATED = 'experimentUpdated',
  EXPERIMENT_STATE_CHANGED = 'experimentStateChanged',
}

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
