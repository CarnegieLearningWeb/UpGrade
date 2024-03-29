import { Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Type } from 'class-transformer';
import { UserStratificationFactor } from './UserStratificationFactor';
import { Experiment } from './Experiment';

@Entity()
export class StratificationFactor extends BaseModel {
  @PrimaryColumn()
  public stratificationFactorName: string;

  @OneToMany(
    () => UserStratificationFactor,
    (userStratificationFactor) => userStratificationFactor.stratificationFactor
  )
  @Type(() => UserStratificationFactor)
  public userStratificationFactor: UserStratificationFactor[];

  @OneToMany(() => Experiment, (experiment) => experiment.stratificationFactor)
  @Type(() => Experiment)
  public experiment: Experiment[];
}
