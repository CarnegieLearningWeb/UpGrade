import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsNotEmpty, IsDefined } from 'class-validator';

@Entity()
export class PreviewUser extends BaseModel {
  @PrimaryColumn()
  @IsNotEmpty()
  @IsDefined()
  public id: string;
}
