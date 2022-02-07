import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupInclusionRepository } from '../repositories/ExplicitExperimentGroupInclusionRepository';
import { ExplicitExperimentIndividualInclusionRepository } from '../repositories/ExplicitExperimentIndividualInclusionRepository';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';

@Service()
export class ExperimentIncludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupInclusionRepository: ExplicitExperimentGroupInclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualInclusionRepository: ExplicitExperimentIndividualInclusionRepository
  ) {}

  public getAllUser(): Promise<ExplicitExperimentIndividualInclusion[]> {
    return this.explicitExperimentIndividualInclusionRepository.find();
  }

  public includeUser(userId: string): Promise<ExplicitExperimentIndividualInclusion> {
    return this.explicitExperimentIndividualInclusionRepository.saveRawJson({ userId });
  }

  public async deleteUser(userId: string): Promise<ExplicitExperimentIndividualInclusion | undefined> {
    const deletedDoc = await this.explicitExperimentIndividualInclusionRepository.deleteById(userId);
    return deletedDoc;
  }

  public getAllGroups(): Promise<ExplicitExperimentGroupInclusion[]> {
    return this.explicitExperimentGroupInclusionRepository.find();
  }

  public includeGroup(groupId: string, type: string): Promise<ExplicitExperimentGroupInclusion> {
    const id = `${type}_${groupId}`;
    return this.explicitExperimentGroupInclusionRepository.saveRawJson({ id, groupId, type });
  }

  public deleteGroup(groupId: string, type: string): Promise<ExplicitExperimentGroupInclusion | undefined> {
    return this.explicitExperimentGroupInclusionRepository.deleteGroup(groupId, type);
  }
}
