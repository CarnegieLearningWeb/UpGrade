import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { MonitoredExperimentPoint } from './MonitoredExperimentPoint';

@Entity()
export class MonitoredExperimentPointLog extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @ManyToOne((type) => MonitoredExperimentPoint, { onDelete: 'CASCADE' })
  public monitoredExperimentPoint: MonitoredExperimentPoint;
}
