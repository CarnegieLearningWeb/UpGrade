import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupExclusionRepository } from '../repositories/ExplicitExperimentGroupExclusionRepository';
import { ExplicitExperimentIndividualExclusionRepository } from '../repositories/ExplicitExperimentIndividualExclusionRepository';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';

@Service()
export class ExperimentExcludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupExclusionRepository: ExplicitExperimentGroupExclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualExclusionRepository: ExplicitExperimentIndividualExclusionRepository
  ) {}

  public getAllUser(): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.explicitExperimentIndividualExclusionRepository.find();
  }

  public excludeUser(userId: string): Promise<ExplicitExperimentIndividualExclusion> {
    return this.explicitExperimentIndividualExclusionRepository.saveRawJson({ userId });
  }

  public async deleteUser(userId: string): Promise<ExplicitExperimentIndividualExclusion | undefined> {
    const deletedDoc = await this.explicitExperimentIndividualExclusionRepository.deleteById(userId);
    return deletedDoc;
  }

  public getAllGroups(): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.explicitExperimentGroupExclusionRepository.find();
  }

  public excludeGroup(groupId: string, type: string): Promise<ExplicitExperimentGroupExclusion> {
    const id = `${type}_${groupId}`;
    return this.explicitExperimentGroupExclusionRepository.saveRawJson({ id, groupId, type });
  }

  public deleteGroup(groupId: string, type: string): Promise<ExplicitExperimentGroupExclusion | undefined> {
    return this.explicitExperimentGroupExclusionRepository.deleteGroup(groupId, type);
  }
}
