import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { MonitoredExperimentPointLog } from './MonitorExperimentPointLog';
import { ENROLLMENT_CODE } from 'upgrade_types';

@Entity()
export class MonitoredExperimentPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column()
  public experimentId: string;

  @Column({
    type: 'enum',
    enum: ENROLLMENT_CODE,
    nullable: true,
  })
  public enrollmentCode: ENROLLMENT_CODE | null;

  @Column({
    nullable: true,
  })
  public condition: string | null;

  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @OneToMany((type) => MonitoredExperimentPointLog, (monitoredPointLog) => monitoredPointLog.monitoredExperimentPoint)
  public monitoredPointLogs: MonitoredExperimentPointLog[];
}

export function getMonitoredExperimentPointID(partitionId: string, userId: string): string {
  return `${partitionId}_${userId}`;
}
