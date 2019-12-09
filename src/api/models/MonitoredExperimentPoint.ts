import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class MonitoredExperimentPoint extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public experimentPoint: string;

  @PrimaryColumn()
  public userId: string;
}
