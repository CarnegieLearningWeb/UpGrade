import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { MonitoredDecisionPoint } from './MonitoredDecisionPoint';

@Entity()
export class MonitoredDecisionPointLog extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @ManyToOne(() => MonitoredDecisionPoint, { onDelete: 'CASCADE' })
  public monitoredDecisionPoint: MonitoredDecisionPoint;
}
