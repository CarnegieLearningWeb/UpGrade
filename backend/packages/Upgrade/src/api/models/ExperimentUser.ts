import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne } from 'typeorm';
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

  @OneToMany(() => ExperimentUser, (user) => user.originalUser)
  public aliases: ExperimentUser[];

  @ManyToOne(() => ExperimentUser, (user) => user.aliases, { onDelete: 'CASCADE' })
  public originalUser: ExperimentUser;

  @OneToMany(() => Log, (log) => log.user)
  public logs: Log[];
}
