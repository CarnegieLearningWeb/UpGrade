import { PrimaryColumn } from 'typeorm';
import { BaseModel } from './BaseModel';

export class BaseMonitoredExperimentPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @PrimaryColumn()
  public userId: string;
}
