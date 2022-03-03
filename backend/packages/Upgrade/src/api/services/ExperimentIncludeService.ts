import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupInclusionRepository } from '../repositories/ExplicitExperimentGroupInclusionRepository';
import { ExplicitExperimentIndividualInclusionRepository } from '../repositories/ExplicitExperimentIndividualInclusionRepository';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@Service()
export class ExperimentIncludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupInclusionRepository: ExplicitExperimentGroupInclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualInclusionRepository: ExplicitExperimentIndividualInclusionRepository,
    public experimentService: ExperimentService
  ) {}

  public getAllExperimentUser(logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion[]> {
    logger.info({ message: `Find all users who are explicitly included at experiment level`});
    return this.explicitExperimentIndividualInclusionRepository.findAllUsers(logger);
  }

  public getExperimentUserById(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion> {
    logger.info({ message: `Find the user who is explicitly included for the given experiment. experimentId => ${experimentId}, userId => ${userId}`});
    return this.explicitExperimentIndividualInclusionRepository.findOneById(userId, experimentId, logger);
  }

  public async experimentIncludeUser(userIds: Array<string>, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion[]> {
    logger.info({ message: `Explicitly include users for the experiment. experimentId => ${experimentId}, userIds => ${userIds}`});
    const experiment: Experiment = await this.experimentService.findOne(experimentId, logger);
    if (!experiment) {
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
  
    return this.explicitExperimentIndividualInclusionRepository.insertExplicitExperimentIndividualInclusion(ExplicitExperimentIndividualIncludeDocToSave, logger);
  }

  public async deleteExperimentUser(userId: string, experimentId, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion | undefined> {
    logger.info({ message: `Delete explicitly included user from the experiment. experimentId: ${experimentId}, userId: ${userId}`});
    const deletedDoc = await this.explicitExperimentIndividualInclusionRepository.deleteById(userId, experimentId, logger);
    return deletedDoc;
  }

  public getAllExperimentGroups(logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion[]> {
    logger.info({ message: `Find all groups who are explicitly included at experiment level`});
    return this.explicitExperimentGroupInclusionRepository.findAllGroups(logger);
  }

  public getExperimentGroupById(type:string, groupId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion> {
    logger.info({ message: `Find the group which is explicitly included for the given experiment. experimentId => ${experimentId}, type => ${type}, groupId => ${groupId}`});
    return this.explicitExperimentGroupInclusionRepository.findOneById(type, groupId, experimentId, logger);
  }

  public async experimentIncludeGroup(groups: Array<{ groupId: string, type: string }>, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion[]> {
    let groupIdInfoForLogger = [];
    let groupTypeInfoForLogger = [];
    groups.forEach( group => {
      groupIdInfoForLogger.push(group.groupId);
      groupTypeInfoForLogger.push(group.type);
    });
    logger.info({ message: `Explicitly include groups for the experiment. experimentId => ${experimentId}, groupIds => ${groupIdInfoForLogger}, types => ${groupTypeInfoForLogger}`});
    const experiment: Experiment = await this.experimentService.findOne(experimentId, logger);
    if (!experiment) {
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
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitExperimentGroupIncludeDoc, groupId: groupId, type: type };
      return rest;
    })) || [];

    return this.explicitExperimentGroupInclusionRepository.insertExplicitExperimentGroupInclusion(explicitExperimentGroupIncludeDocToSave, logger);
  }

  public deleteExperimentGroup(groupId: string, type: string, experimentId, logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion | undefined> {
    logger.info({ message: `Delete explicitly included group from the experiment. experimentId: ${experimentId}, type => ${type}, groupId: ${groupId}`});
    return this.explicitExperimentGroupInclusionRepository.deleteGroup(groupId, type, experimentId, logger);
  }
}
