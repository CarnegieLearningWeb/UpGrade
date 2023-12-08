import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsUrl, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperimentAuditLog } from './ExperimentAuditLog';
import { UserRole } from 'upgrade_types';

@Entity()
export class User extends BaseModel {
  @PrimaryColumn()
  public email: string;

  @Column({ nullable: true })
  @IsString()
  public firstName: string;

  @Column({ nullable: true })
  @IsString()
  public lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CREATOR,
    nullable: true,
  })
  public role: UserRole;

  @Column({ nullable: true })
  @IsUrl()
  public imageUrl: string;

  @Column({ nullable: true })
  public localTimeZone?: string;

  @OneToMany(() => ExperimentAuditLog, (auditLog) => auditLog.user)
  @Type(() => ExperimentAuditLog)
  public auditLogs?: ExperimentAuditLog[];
}
