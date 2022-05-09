import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { MonitoredExperimentPointLog } from './MonitorExperimentPointLog';

@Entity()
export class MonitoredExperimentPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @Column()
  public experimentId: string;

  @Column({
    nullable: true,
  })
  public condition: string;

  @Index()
  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @OneToMany((type) => MonitoredExperimentPointLog, (monitoredPointLog) => monitoredPointLog.monitoredExperimentPoint)
  public monitoredPointLogs: MonitoredExperimentPointLog[];
}

export function getMonitoredExperimentPointID(partitionId: string, userId: string): string {
  return `${partitionId}_${userId}`;
}
