import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { SERVER_ERROR } from 'upgrade_types';

@Entity()
export class ExperimentError extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ nullable: true })
  public endPoint: string;

  @Column({ nullable: true })
  public errorCode: number;

  @Column({ nullable: true })
  public message: string;

  @Column({ nullable: true })
  public name: string;

  @Column({ type: 'enum', enum: SERVER_ERROR })
  public type: SERVER_ERROR;
}
