import { IsNotEmpty } from 'class-validator';
import { Entity, PrimaryColumn, Column } from 'typeorm';
import { SUPPORTED_MOOCLET_POLICY_NAMES } from 'upgrade_types';

@Entity()
export class MoocletPolicySupport {
  @PrimaryColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column({
    type: 'enum',
    enum: SUPPORTED_MOOCLET_POLICY_NAMES,
  })
  policy_name: SUPPORTED_MOOCLET_POLICY_NAMES;

  @Column('jsonb')
  policy_paramater_schema: object;
}