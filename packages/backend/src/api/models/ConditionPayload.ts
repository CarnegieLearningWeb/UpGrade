import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { DecisionPoint } from './DecisionPoint';
import { PAYLOAD_TYPE } from 'upgrade_types';

@Entity()
export class ConditionPayload extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  public payloadValue: string;

  @Column({
    type: 'enum',
    enum: PAYLOAD_TYPE,
    default: PAYLOAD_TYPE.STRING,
  })
  public payloadType: PAYLOAD_TYPE;

  @ManyToOne(() => ExperimentCondition, (condition) => condition.conditionPayloads, { onDelete: 'CASCADE' })
  public parentCondition: ExperimentCondition;

  @ManyToOne(() => DecisionPoint, (decisionPoint) => decisionPoint.conditionPayloads, { onDelete: 'CASCADE' })
  public decisionPoint: DecisionPoint;
}
