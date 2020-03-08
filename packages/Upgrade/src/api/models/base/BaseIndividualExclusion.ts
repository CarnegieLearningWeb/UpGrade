import { PrimaryColumn } from 'typeorm';
import { BaseModel } from './BaseModel';

export class BaseIndividualExclusion extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;
}
