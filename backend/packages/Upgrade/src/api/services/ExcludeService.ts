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

  public excludeUser(userIds: Array<string>): Promise<ExplicitIndividualExclusion[]> {
    let explicitIndividualExclusionDoc = new ExplicitIndividualExclusion();

    const ExplicitIndividualExclusionDocToSave: Array<Partial<ExplicitIndividualExclusion>> =
    (userIds &&
      userIds.length > 0 &&
      userIds.map((userId: string) => {
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitIndividualExclusionDoc, userId: userId };
      return rest;
    })) || [];
    return this.explicitIndividualExclusionRepository.saveRawJson(ExplicitIndividualExclusionDocToSave);
  }

  public async deleteUser(userId: string): Promise<ExplicitIndividualExclusion | undefined> {
    const deletedDoc = await this.explicitIndividualExclusionRepository.deleteById(userId);
    return deletedDoc;
  }

  public getAllGroups(): Promise<ExplicitGroupExclusion[]> {
    return this.explicitGroupExclusionRepository.find();
  }

  public excludeGroup(groups: Array<{ groupId: string, type: string }>): Promise<ExplicitGroupExclusion[]> {
    let explicitGroupExclusionDoc = new ExplicitGroupExclusion();
    
    const ExplicitGroupExclusionDocToSave: Array<Partial<ExplicitGroupExclusion>> =
    (groups &&
      groups.length > 0 &&
      groups.map((group: { groupId: string, type: string }) => {
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitGroupExclusionDoc, groupId: group.groupId, type: group.type };
      return rest;
    })) || [];
    return this.explicitGroupExclusionRepository.saveRawJson(ExplicitGroupExclusionDocToSave);
  }

  public deleteGroup(groupId: string, type: string): Promise<ExplicitGroupExclusion | undefined> {
    return this.explicitGroupExclusionRepository.deleteGroup(groupId, type);
  }
}
