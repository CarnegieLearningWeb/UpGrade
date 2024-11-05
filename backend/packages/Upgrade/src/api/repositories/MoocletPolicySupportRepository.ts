import { Repository } from 'typeorm';
import { MoocletPolicySupport as MoocletPolicySupportSchema } from '../models/MoocletPolicySupport';
import { EntityRepository } from '../../typeorm-typedi-extensions';


@EntityRepository(MoocletPolicySupportSchema)
export class MoocletPolicySupportRepository extends Repository<MoocletPolicySupportSchema> {
  // You can add custom methods here if needed
}