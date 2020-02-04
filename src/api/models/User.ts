import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsUrl, IsString } from 'class-validator';

@Entity()
export class User extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @PrimaryColumn()
  public email: string;

  @Column({ nullable: true })
  @IsString()
  public firstName: string;

  @Column({ nullable: true })
  @IsString()
  public lastName: string;

  @Column({ nullable: true })
  @IsUrl()
  public imageUrl: string;
}
