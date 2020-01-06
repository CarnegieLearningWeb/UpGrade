import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class MonitoredExperimentPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @PrimaryColumn()
  public userId: string;
}
