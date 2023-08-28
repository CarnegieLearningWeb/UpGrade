import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { MonitoredDecisionPoint } from './MonitoredDecisionPoint';

@Entity()
export class MonitoredDecisionPointLog extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({
    nullable: true,
  })
  public condition?: string | null;

  @Column({
    nullable: true,
  })
  public uniquifier: string | null;

  @ManyToOne(() => MonitoredDecisionPoint, { onDelete: 'CASCADE' })
  public monitoredDecisionPoint: MonitoredDecisionPoint;
}
