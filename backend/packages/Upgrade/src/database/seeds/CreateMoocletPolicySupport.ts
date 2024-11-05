import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { MoocletPolicySupport } from '../../api/models/MoocletPolicySupport';
import { SUPPORTED_MOOCLET_POLICY_NAMES } from '../../../types';

export class CreateMoocletPolicySupport implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(MoocletPolicySupport)
      .values([
        {
          id: 'uuid1',
          policy_name: SUPPORTED_MOOCLET_POLICY_NAMES.TS_CONFIGURABLE,
          policy_paramater_schema: {
            type: 'object',
            properties: {
              param1: { type: 'string' },
              param2: { type: 'number' },
            },
            required: ['param1', 'param2'],
          },
        },
      ])
      .execute();
  }
}