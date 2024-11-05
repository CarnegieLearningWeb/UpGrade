import { InjectRepository } from "src/typeorm-typedi-extensions";
import { MoocletPolicySupportRepository } from "../repositories/MoocletPolicySupportRepository";
import { MoocletPolicySupport } from "../models/MoocletPolicySupport";


export class MoocletPolicySupportService {
    constructor(
    @InjectRepository()
    private moocletPolicyParametersSchemaRepository: MoocletPolicySupportRepository
    ) {}
  async getAll(): Promise<MoocletPolicySupport[]> {
    try {
      return await this.moocletPolicyParametersSchemaRepository.find();
    } catch (error) {
      throw new Error('Error fetching schemas');
    }
  }
}
