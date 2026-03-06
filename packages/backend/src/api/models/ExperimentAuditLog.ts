import { BaseModel } from './base/BaseModel';
import { PrimaryGeneratedColumn, Column, Entity, ManyToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { LOG_TYPE } from 'upgrade_types';
import { User } from './User';

@Entity()
export class ExperimentAuditLog extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: LOG_TYPE,
  })
  public type: LOG_TYPE;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'CASCADE' })
  public user: User;

  @Column({ type: 'json' })
  public data: object;
}
