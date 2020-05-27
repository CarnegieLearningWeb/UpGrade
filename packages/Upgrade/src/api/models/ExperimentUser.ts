import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IsNotEmpty, IsDefined } from 'class-validator';
import { Log } from './Log';

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

  @OneToMany((type) => Log, (log) => log.user)
  public logs: Log[];
}
