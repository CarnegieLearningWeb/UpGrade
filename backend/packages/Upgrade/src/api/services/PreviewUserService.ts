import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid/v4';
import { PreviewUser } from '../models/PreviewUser';
import { PreviewUserRepository } from '../repositories/PreviewUserRepository';
import { ExplicitIndividualAssignmentRepository } from '../repositories/ExplicitIndividualAssignmentRepository';
import { ExplicitIndividualAssignment } from '../models/ExplicitIndividualAssignment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

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

  public create(user: Partial<PreviewUser>, logger: UpgradeLogger): Promise<PreviewUser> {
    logger.info({ message: `Create a new preview user => ${user}` });
    user.id = user.id || uuid();

    return this.userRepository.save(user);
  }

  public update(id: string, user: PreviewUser, logger: UpgradeLogger): Promise<PreviewUser> {
    logger.info({ message: `Update a preview user => ${user.toString()}` });
    user.id = id;
    return this.userRepository.save(user);
  }

  public async delete(id: string, logger: UpgradeLogger): Promise<PreviewUser | undefined> {
    logger.info({ message: `Delete a user => ${id.toString()}` });
    const deletedDoc = await this.userRepository.deleteById(id);
    return deletedDoc;
  }

  public async upsertExperimentConditionAssignment(
    previewUser: PreviewUser,
    logger: UpgradeLogger
  ): Promise<PreviewUser | undefined> {
    logger.info({ message: `Upsert Experiment Condition Assignment ${JSON.stringify(previewUser, undefined, 1)}` });

    const previewDocumentWithOldAssignments = await this.findOne(previewUser.id, logger);
    const newAssignments = previewUser.assignments;

    const assignmentDocToSave: Array<Partial<ExplicitIndividualAssignment>> =
      (newAssignments &&
        newAssignments.length > 0 &&
        newAssignments.map((assignment: ExplicitIndividualAssignment) => {
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
}
