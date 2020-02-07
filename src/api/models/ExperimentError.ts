import { Entity, PrimaryColumn, Column } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { SERVER_ERROR } from 'ees_types';

@Entity()
export class ExperimentError extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @IsNotEmpty()
  @Column()
  public endPoint: string;

  @IsNotEmpty()
  @Column()
  public errorCode: number;

  @IsNotEmpty()
  @Column()
  public message: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column({ type: 'enum', enum: SERVER_ERROR })
  public type: SERVER_ERROR;
}
