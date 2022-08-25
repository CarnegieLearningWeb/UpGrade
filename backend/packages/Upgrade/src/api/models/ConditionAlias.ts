import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { DecisionPoint } from './DecisionPoint';

@Entity()
export class ConditionAlias extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  public aliasName: string;

  @ManyToOne((type) => ExperimentCondition, (condition) => condition.parentCondition, { onDelete: 'CASCADE' })
  public parentCondition: ExperimentCondition;

  @ManyToOne((type) => DecisionPoint, (decisionPoint) => decisionPoint.ConditionAliases, { onDelete: 'CASCADE' })
  public decisionPoint: DecisionPoint;
}