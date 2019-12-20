import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsNotEmpty, IsObject, IsDefined } from 'class-validator';

@Entity()
export class User extends BaseModel {

  @PrimaryColumn()
  @IsNotEmpty()
  @IsDefined()
  public id: string;

  @Column({ type: 'json' })
  @IsObject()
  @IsDefined()
  public group: object;
}
