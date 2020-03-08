import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsNotEmpty, IsDefined } from 'class-validator';

@Entity()
export class ExperimentUser extends BaseModel {
  @PrimaryColumn()
  @IsNotEmpty()
  @IsDefined()
  public id: string;

  @Column({ type: 'json', nullable: true })
  public group: object | undefined;

  @Column({ type: 'json', nullable: true })
  public workingGroup: object | undefined;
}
