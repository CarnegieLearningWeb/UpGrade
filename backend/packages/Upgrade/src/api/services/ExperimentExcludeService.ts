import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupExclusionRepository } from '../repositories/ExplicitExperimentGroupExclusionRepository';
import { ExplicitExperimentIndividualExclusionRepository } from '../repositories/ExplicitExperimentIndividualExclusionRepository';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { SegmentService } from './SegmentService';

@Service()
export class ExperimentExcludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupExclusionRepository: ExplicitExperimentGroupExclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualExclusionRepository: ExplicitExperimentIndividualExclusionRepository,
    @OrmRepository()
    private experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    public experimentService: ExperimentService,
    public segmentService: SegmentService
  ) {}

  public getAllExperimentUser(logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion[]> {
    logger.info({ message: `Find all users who are explicitly excluded at experiment level`});
    return this.explicitExperimentIndividualExclusionRepository.findAllUsers(logger);
  }

  public getExperimentUserById(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion> {
    logger.info({ message: `Find the user who is explicitly excluded for the given experiment. experimentId => ${experimentId}, userId => ${userId}`});
    return this.explicitExperimentIndividualExclusionRepository.findOneById(userId, experimentId, logger);
  }

  public async experimentExcludeUser(userIds: Array<string>, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion[]> {
    logger.info({ message: `Explicitly exclude users from the experiment. experimentId => ${experimentId}, userIds => ${userIds}`});
    const experiment: Experiment = await this.experimentService.findOne(experimentId, logger);
    if (!experiment) {
      const error: any = `experiment not found`;
      logger.error(error);
      throw new Error('experiment not found');
    }

    let explicitExperimentIndividualExcludeDoc = new ExplicitExperimentIndividualExclusion();
    explicitExperimentIndividualExcludeDoc.experiment = experiment;

    const ExplicitExperimentIndividualExcludeDocToSave: Array<Partial<ExplicitExperimentIndividualExclusion>> =
    (userIds &&
      userIds.length > 0 &&
      userIds.map((userId: string) => {
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitExperimentIndividualExcludeDoc, userId: userId };
      return rest;
    })) || [];
  
    return this.explicitExperimentIndividualExclusionRepository.insertExplicitExperimentIndividualExclusion(ExplicitExperimentIndividualExcludeDocToSave, logger);
  }

  public async deleteExperimentUser(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion | undefined> {
    logger.info({ message: `Delete explicitly excluded user from the experiment. experimentId: ${experimentId}, userId: ${userId}`});
    const deletedDoc = await this.explicitExperimentIndividualExclusionRepository.deleteById(userId, experimentId, logger);
    return deletedDoc;
  }

  public getAllExperimentGroups(logger: UpgradeLogger): Promise<ExplicitExperimentGroupExclusion[]> {
    logger.info({ message: `Find all groups who are explicitly excluded at experiment level`});
    return this.explicitExperimentGroupExclusionRepository.findAllGroups(logger);
  }

  public getExperimentGroupById(type:string, groupId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupExclusion> {
    logger.info({ message: `Find the group which is explicitly excluded for the given experiment. experimentId => ${experimentId}, type => ${type}, groupId => ${groupId}`});
    return this.explicitExperimentGroupExclusionRepository.findOneById(type, groupId, experimentId, logger);
  }

  public async experimentExcludeGroup(groups: Array<{ groupId: string, type: string }>, experimentId: string, logger: UpgradeLogger): Promise<any> {
    logger.info({ message: `Explicitly exclude groups from the experiment. experimentId => ${experimentId}`, groupDetails: groups });
    const experiment: Experiment = await this.experimentService.findOne(experimentId, logger);
    if (!experiment) {
      const error: any = `experiment not found`;
      logger.error(error);
      throw new Error('experiment not found');
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

    return this.explicitExperimentGroupExclusionRepository.insertExplicitExperimentGroupExclusion(explicitExperimentGroupExcludeDocToSave, logger);
  }

  public deleteExperimentGroup(groupId: string, type: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupExclusion | undefined> {
    logger.info({ message: `Delete explicitly excluded group from the experiment. experimentId: ${experimentId}, type => ${type}, groupId: ${groupId}`});
    return this.explicitExperimentGroupExclusionRepository.deleteGroup(groupId, type, experimentId, logger);
  }

  public deleteExperimentSegment(experimentId: string, segmentId: string, logger: UpgradeLogger): Promise<ExperimentSegmentExclusion | undefined> {
    logger.info({ message: `Delete explicitly excluded segment from the experiment. experimentId: ${experimentId}, segmentId: ${segmentId}`});
    return this.experimentSegmentExclusionRepository.deleteData(segmentId, experimentId, logger);
  }
}
