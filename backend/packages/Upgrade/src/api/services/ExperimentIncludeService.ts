import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupInclusionRepository } from '../repositories/ExplicitExperimentGroupInclusionRepository';
import { ExplicitExperimentIndividualInclusionRepository } from '../repositories/ExplicitExperimentIndividualInclusionRepository';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';

@Service()
export class ExperimentIncludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupInclusionRepository: ExplicitExperimentGroupInclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualInclusionRepository: ExplicitExperimentIndividualInclusionRepository,
    public experimentService: ExperimentService
  ) {}

  public getAllExperimentUser(): Promise<ExplicitExperimentIndividualInclusion[]> {
    return this.explicitExperimentIndividualInclusionRepository.findAllUsers();
  }

  public getExperimentUserById(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualInclusion> {
    return this.explicitExperimentIndividualInclusionRepository.findOneById(userId, experimentId);
  }

  public async experimentIncludeUser(userIds: Array<string>, experimentId: string): Promise<ExplicitExperimentIndividualInclusion[]> {
    const experiment: Experiment = await this.experimentService.findOne(experimentId);
    if(!experiment) {
      throw new Error('experiment not found');
    }

    let ExplicitExperimentIndividualIncludeDoc = new ExplicitExperimentIndividualInclusion();
    ExplicitExperimentIndividualIncludeDoc.experiment = experiment;

    const ExplicitExperimentIndividualIncludeDocToSave: Array<Partial<ExplicitExperimentIndividualInclusion>> =
    (userIds &&
      userIds.length > 0 &&
      userIds.map((userId: string) => {
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...ExplicitExperimentIndividualIncludeDoc, userId: userId };
      return rest;
    })) || [];
  
    return this.explicitExperimentIndividualInclusionRepository.insertExplicitExperimentIndividualInclusion(ExplicitExperimentIndividualIncludeDocToSave);
  }

  public async deleteExperimentUser(userId: string, experimentId): Promise<ExplicitExperimentIndividualInclusion | undefined> {
    const deletedDoc = await this.explicitExperimentIndividualInclusionRepository.deleteById(userId, experimentId);
    return deletedDoc;
  }

  public getAllExperimentGroups(): Promise<ExplicitExperimentGroupInclusion[]> {
    return this.explicitExperimentGroupInclusionRepository.findAllGroups();
  }

  public getExperimentGroupById(type:string, groupId: string, experimentId: string): Promise<ExplicitExperimentGroupInclusion> {
    const id: string = `${type}_${groupId}`;
    return this.explicitExperimentGroupInclusionRepository.findOneById(id, experimentId);
  }

  public async experimentIncludeGroup(groups: Array<{ groupId: string, type: string }>, experimentId: string): Promise<ExplicitExperimentGroupInclusion[]> {
    const experiment: Experiment = await this.experimentService.findOne(experimentId);
    if(!experiment) {
      throw new Error('experiment not found');
    }
    let explicitExperimentGroupIncludeDoc = new ExplicitExperimentGroupInclusion();
    explicitExperimentGroupIncludeDoc.experiment = experiment;

    const explicitExperimentGroupIncludeDocToSave: Array<Partial<ExplicitExperimentGroupInclusion>> =
    (groups &&
      groups.length > 0 &&
      groups.map((group) => {
        const groupId: string = group.groupId;
        const type: string = group.type;
        const id: string = `${type}_${groupId}`;
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitExperimentGroupIncludeDoc, id: id, groupId: groupId, type: type };
      return rest;
    })) || [];

    return this.explicitExperimentGroupInclusionRepository.insertExplicitExperimentGroupInclusion(explicitExperimentGroupIncludeDocToSave);
  }

  public deleteExperimentGroup(groupId: string, type: string, experimentId): Promise<ExplicitExperimentGroupInclusion | undefined> {
    return this.explicitExperimentGroupInclusionRepository.deleteGroup(groupId, type, experimentId);
  }
}
