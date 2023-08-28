import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid/v4';
import { PreviewUser } from '../models/PreviewUser';
import { PreviewUserRepository } from '../repositories/PreviewUserRepository';
import { ExplicitIndividualAssignmentRepository } from '../repositories/ExplicitIndividualAssignmentRepository';
import { ExplicitIndividualAssignment } from '../models/ExplicitIndividualAssignment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { PreviewUserValidator } from '../controllers/validators/PreviewUserValidator';

@Service()
export class PreviewUserService {
  constructor(
    @OrmRepository() private userRepository: PreviewUserRepository,
    @OrmRepository() private explicitIndividualAssignmentRepository: ExplicitIndividualAssignmentRepository
  ) {}

  public async find(logger: UpgradeLogger): Promise<PreviewUser[]> {
    logger.info({ message: `Find all preview users` });
    const [previewUsers, assignments] = await Promise.all([
      this.userRepository.find(),
      this.userRepository.findWithNames(),
    ]);
    return previewUsers.map((user) => {
      const doc = assignments.find((assignment) => {
        return assignment.id === user.id;
      });
      return doc ? doc : user;
    });
  }

  public async findOne(id: string, logger: UpgradeLogger): Promise<PreviewUser | undefined> {
    logger.info({ message: `Find user by id => ${id}` });
    const [previewUser, assignments] = await Promise.all([
      this.userRepository.findOne({ id }),
      this.userRepository.findOneById(id),
    ]);
    return assignments ? assignments : previewUser;
  }

  public getTotalCount(logger: UpgradeLogger): Promise<number> {
    logger.info({ message: `Find count of preview users` });
    return this.userRepository.count();
  }

  public async findPaginated(skip: number, take: number, logger: UpgradeLogger): Promise<PreviewUser[]> {
    logger.info({ message: `Find paginated preview users` });
    const [previewUsers, assignments] = await Promise.all([
      this.userRepository.findPaginated(skip, take),
      this.userRepository.findWithNames(),
    ]);
    return previewUsers.map((user) => {
      const doc = assignments.find((assignment) => {
        return assignment.id === user.id;
      });
      return doc ? doc : user;
    });
  }

  public create(userDTO: PreviewUserValidator, logger: UpgradeLogger): Promise<PreviewUser> {
    logger.info({ message: `Create a new preview user => ${userDTO}` });   
    userDTO.id = userDTO.id || uuid();
    return this.userRepository.save(this.previewUserValidatorToUser(userDTO));
  }

  public update(id: string, userDTO: PreviewUserValidator, logger: UpgradeLogger): Promise<PreviewUser> {
    logger.info({ message: `Update a preview user => ${userDTO.toString()}` });
    userDTO.id = id;
    return this.userRepository.save(this.previewUserValidatorToUser(userDTO));
  }

  public async delete(id: string, logger: UpgradeLogger): Promise<PreviewUser | undefined> {
    logger.info({ message: `Delete a user => ${id.toString()}` });
    const deletedDoc = await this.userRepository.deleteById(id);
    return deletedDoc;
  }

  public async upsertExperimentConditionAssignment(
    previewUserDTO: PreviewUserValidator,
    logger: UpgradeLogger
  ): Promise<PreviewUser | undefined> {
    logger.info({ message: `Upsert Experiment Condition Assignment ${JSON.stringify(previewUserDTO, undefined, 1)}` });

    const previewUser = this.previewUserValidatorToUser(previewUserDTO);
    const previewDocumentWithOldAssignments = await this.findOne(previewUser.id, logger);
    const newAssignments = previewUser.assignments;

    const assignmentDocToSave: Array<Partial<ExplicitIndividualAssignment>> =
      (newAssignments &&
        newAssignments.length > 0 &&
        newAssignments.map((assignment: ExplicitIndividualAssignment) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { createdAt, updatedAt, versionNumber, ...rest } = assignment;
          rest.previewUser = previewUser;
          rest.id = rest.id || uuid();
          rest.experimentCondition = assignment.experimentCondition.id as any;
          rest.experiment = assignment.experiment.id as any;
          return rest;
        })) ||
      [];

    if (previewDocumentWithOldAssignments && previewDocumentWithOldAssignments.assignments) {
      // delete conditions which don't exist in new experiment document
      const toDeleteAssignments = [];
      previewDocumentWithOldAssignments.assignments.forEach((assignment) => {
        if (
          !assignmentDocToSave.find((doc) => {
            return doc.id === assignment.id;
          })
        ) {
          toDeleteAssignments.push(this.explicitIndividualAssignmentRepository.delete({ id: assignment.id }));
        }
      });

      // delete old assignments
      if (toDeleteAssignments.length > 0) {
        await Promise.all(toDeleteAssignments);
      }
    }

    // save new documents
    if (assignmentDocToSave.length > 0) {
      await this.explicitIndividualAssignmentRepository.save(assignmentDocToSave);
    }
    const getDocument = await this.findOne(previewUser.id, logger);
    return getDocument;
  }

  private previewUserValidatorToUser(userDTO: PreviewUserValidator): PreviewUser {
    const user = new PreviewUser();
    user.id = userDTO.id;
    user.assignments = userDTO.assignments?.map((assignmentDTO) => {
      const assignment = new ExplicitIndividualAssignment();
      assignment.id = assignmentDTO.id;
      assignment.experiment = assignmentDTO.experiment;
      assignment.experimentCondition = assignmentDTO.experimentCondition;
      return assignment;
    })
    return user;
  }
}
