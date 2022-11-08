import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { MonitoredDecisionPointLog } from './MonitoredDecisionPointLog';

@Entity()
export class MonitoredDecisionPoint extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Index()
  @Column()
  @IsNotEmpty()
  public site: string;

  @Index()
  @Column({ nullable: true })
  public target: string;

  @Column({
    nullable: true,
  })
  public experimentId: string;

  @Column({
    nullable: true,
  })
  public condition: string;

  @Index()
  @ManyToOne(() => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;

  @OneToMany(() => MonitoredDecisionPointLog, (monitoredPointLog) => monitoredPointLog.monitoredDecisionPoint)
  public monitoredPointLogs: MonitoredDecisionPointLog[];
}
