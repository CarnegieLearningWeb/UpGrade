import { PrimaryColumn } from 'typeorm';
import { BaseModel } from './BaseModel';

export class BaseGroupExclusion extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;
}
