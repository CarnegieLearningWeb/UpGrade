import { Authorized, Get, JsonController } from 'routing-controllers';
import { MoocletPolicySupportService } from '../services/MoocletPolicySupportService';

@Authorized()
@JsonController('/mooclet-policy-support')
export class MoocletPolicySupportController {
    constructor(public moocletPolicySupportService: MoocletPolicySupportService) {}
    @Get('/')
    async getAll() {
        try {
          const policyMetadata = await this.moocletPolicySupportService.getAll();
          return policyMetadata;
        } catch (error) {
          throw new Error('Error fetching mooclet policy support');
        }
    }
}