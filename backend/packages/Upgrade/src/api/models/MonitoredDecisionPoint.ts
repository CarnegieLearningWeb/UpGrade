import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { MonitoredDecisionPointLog } from './MonitoredDecisionPointLog';

@Entity()
export class MonitoredDecisionPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @Column()
  public decisionPoint: string;

  @Column({
    nullable: true,
  })
  public condition: string;

  @Index()
  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @OneToMany((type) => MonitoredDecisionPointLog, (monitoredPointLog) => monitoredPointLog.monitoredDecisionPoint)
  public monitoredPointLogs: MonitoredDecisionPointLog[];
}

export function getMonitoredDecisionPointId(decisionPoint: string, userId: string): string {
  return `${decisionPoint}_${userId}`;
}
