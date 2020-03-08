import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitGroupExclusionRepository } from '../repositories/ExplicitGroupExclusionRepository';
import { ExplicitIndividualExclusionRepository } from '../repositories/ExplicitIndividualExclusionRepository';
import { ExplicitIndividualExclusion } from '../models/ExplicitIndividualExclusion';
import { ExplicitGroupExclusion } from '../models/ExplicitGroupExclusion';

@Service()
export class ExcludeService {
  constructor(
    @OrmRepository()
    private explicitGroupExclusionRepository: ExplicitGroupExclusionRepository,
    @OrmRepository()
    private explicitIndividualExclusionRepository: ExplicitIndividualExclusionRepository
  ) {}

  public getAllUser(): Promise<ExplicitIndividualExclusion[]> {
    return this.explicitIndividualExclusionRepository.find();
  }

  public excludeUser(userId: string): Promise<ExplicitIndividualExclusion> {
    return this.explicitIndividualExclusionRepository.saveRawJson({ userId });
  }

  public async deleteUser(userId: string): Promise<ExplicitIndividualExclusion | undefined> {
    const deletedDoc = await this.explicitIndividualExclusionRepository.deleteById(userId);
    return deletedDoc;
  }

  public getAllGroups(): Promise<ExplicitGroupExclusion[]> {
    return this.explicitGroupExclusionRepository.find();
  }

  public excludeGroup(groupId: string, type: string): Promise<ExplicitGroupExclusion> {
    const id = `${type}_${groupId}`;
    return this.explicitGroupExclusionRepository.saveRawJson({ id, groupId, type });
  }

  public deleteGroup(groupId: string, type: string): Promise<ExplicitGroupExclusion | undefined> {
    return this.explicitGroupExclusionRepository.deleteGroup(groupId, type);
  }
}
