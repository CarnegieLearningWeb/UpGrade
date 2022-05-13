import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExplicitExperimentGroupInclusionRepository } from '../repositories/ExplicitExperimentGroupInclusionRepository';
import { ExplicitExperimentIndividualInclusionRepository } from '../repositories/ExplicitExperimentIndividualInclusionRepository';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import { ExperimentService } from './ExperimentService';
import { Experiment } from '../models/Experiment';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { SegmentService } from './SegmentService';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';

@Service()
export class ExperimentIncludeService {
  constructor(
    @OrmRepository()
    private explicitExperimentGroupInclusionRepository: ExplicitExperimentGroupInclusionRepository,
    @OrmRepository()
    private explicitExperimentIndividualInclusionRepository: ExplicitExperimentIndividualInclusionRepository,
    @OrmRepository()
    private experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    public experimentService: ExperimentService,
    public segmentService: SegmentService
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
      const error: any = `experiment not found`;
      logger.error(error);
      throw new Error('experiment not found');
    }

    let explicitExperimentIndividualIncludeDoc = new ExplicitExperimentIndividualInclusion();
    explicitExperimentIndividualIncludeDoc.experiment = experiment;

    const ExplicitExperimentIndividualIncludeDocToSave: Array<Partial<ExplicitExperimentIndividualInclusion>> =
    (userIds &&
      userIds.length > 0 &&
      userIds.map((userId: string) => {
        const { createdAt, updatedAt, versionNumber, ...rest } = { ...explicitExperimentIndividualIncludeDoc, userId: userId };
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
    logger.info({ message: `Explicitly include groups from the experiment. experimentId => ${experimentId}`, groupDetails: groups });
    const experiment: Experiment = await this.experimentService.findOne(experimentId, logger);
    if (!experiment) {
      const error: any = `experiment not found`;
      logger.error(error);
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

  public async experimentIncludeSegment(experimentId: string, segmentId: string, logger: UpgradeLogger): Promise<ExperimentSegmentInclusion> {
    logger.info({ message: `Explicitly include segment from the experiment. experimentId: ${experimentId}, segmentId: ${segmentId}`});

    let tempDoc = new ExperimentSegmentInclusion();
    tempDoc.experiment = await this.experimentService.findOne(experimentId, logger);
    tempDoc.segment = await this.segmentService.getSegmentById(segmentId, logger);
    
    const { createdAt, updatedAt, versionNumber, ...docToSend } = tempDoc;
    return this.experimentSegmentInclusionRepository.insertData(docToSend, logger);
  }

  public deleteExperimentSegment(experimentId: string, segmentId: string, logger: UpgradeLogger): Promise<ExperimentSegmentInclusion | undefined> {
    logger.info({ message: `Delete explicitly included segment from the experiment. experimentId: ${experimentId}, segmentId: ${segmentId}`});
    return this.experimentSegmentInclusionRepository.deleteData(segmentId, experimentId, logger);
  }
}
