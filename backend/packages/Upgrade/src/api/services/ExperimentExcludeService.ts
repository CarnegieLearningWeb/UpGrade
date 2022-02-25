import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupExclusionRepository } from '../repositories/ExplicitExperimentGroupExclusionRepository';
import { ExplicitExperimentIndividualExclusionRepository } from '../repositories/ExplicitExperimentIndividualExclusionRepository';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';

@Service()
export class ExperimentExcludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupExclusionRepository: ExplicitExperimentGroupExclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualExclusionRepository: ExplicitExperimentIndividualExclusionRepository,
    public experimentService: ExperimentService
  ) {}

  public getAllExperimentUser(): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.explicitExperimentIndividualExclusionRepository.findAllUsers();
  }

  public getExperimentUserById(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualExclusion> {
    return this.explicitExperimentIndividualExclusionRepository.findOneById(userId, experimentId);
  }

  public async experimentExcludeUser(userIds: Array<string>, experimentId: string): Promise<ExplicitExperimentIndividualExclusion[]> {
    const experiment: Experiment = await this.experimentService.findOne(experimentId);
    if(!experiment) {
      throw new Error('experiment not found');
    }

    let ExplicitExperimentIndividualExcludeDoc = new ExplicitExperimentIndividualExclusion();
    ExplicitExperimentIndividualExcludeDoc.experiment = experiment;

    const ExplicitExperimentIndividualExcludeDocToSave: Array<Partial<ExplicitExperimentIndividualExclusion>> =
    (userIds &&
      userIds.length > 0 &&
      userIds.map((userId: string) => {
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...ExplicitExperimentIndividualExcludeDoc, userId: userId };
      return rest;
    })) || [];
  
    return this.explicitExperimentIndividualExclusionRepository.insertExplicitExperimentIndividualExclusion(ExplicitExperimentIndividualExcludeDocToSave);
  }

  public async deleteExperimentUser(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualExclusion | undefined> {
    const deletedDoc = await this.explicitExperimentIndividualExclusionRepository.deleteById(userId, experimentId);
    return deletedDoc;
  }

  public getAllExperimentGroups(): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.explicitExperimentGroupExclusionRepository.findAllGroups();
  }

  public getExperimentGroupById(type:string, groupId: string, experimentId: string): Promise<ExplicitExperimentGroupExclusion> {
    return this.explicitExperimentGroupExclusionRepository.findOneById(type, groupId, experimentId);
  }

  public async experimentExcludeGroup(groups: Array<{ groupId: string, type: string }>, experimentId: string): Promise<any> {
    const experiment: Experiment = await this.experimentService.findOne(experimentId);
    if(!experiment) {
      throw new Error(' experiment not found');
    }
    let explicitExperimentGroupExcludeDoc = new ExplicitExperimentGroupExclusion();
    explicitExperimentGroupExcludeDoc.experiment = experiment;

    const explicitExperimentGroupExcludeDocToSave: Array<Partial<ExplicitExperimentGroupExclusion>> =
    (groups &&
      groups.length > 0 &&
      groups.map((group) => {
        const groupId: string = group.groupId;
        const type: string = group.type;
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitExperimentGroupExcludeDoc, groupId: groupId, type: type };
      return rest;
    })) || [];

    return this.explicitExperimentGroupExclusionRepository.insertExplicitExperimentGroupExclusion(explicitExperimentGroupExcludeDocToSave);
  }

  public deleteExperimentGroup(groupId: string, type: string, experimentId: string): Promise<ExplicitExperimentGroupExclusion | undefined> {
    return this.explicitExperimentGroupExclusionRepository.deleteGroup(groupId, type, experimentId);
  }
}
