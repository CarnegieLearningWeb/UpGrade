import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsUrl, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperimentAuditLog } from './ExperimentAuditLog';

@Entity()
export class User extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @PrimaryColumn()
  public email: string;

  @Column({ nullable: true })
  @IsString()
  public firstName: string;

  @Column({ nullable: true })
  @IsString()
  public lastName: string;

  @Column({ nullable: true })
  @IsUrl()
  public imageUrl: string;

  @OneToMany(
    type => ExperimentAuditLog,
    auditLog => auditLog.user
  )
  @Type(() => ExperimentAuditLog)
  public auditLogs: ExperimentAuditLog[];
}
