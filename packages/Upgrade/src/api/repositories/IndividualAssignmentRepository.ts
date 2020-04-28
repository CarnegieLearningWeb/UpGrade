import { EntityRepository, Repository } from 'typeorm';
import { IndividualAssignment } from '../models/IndividualAssignment';
import repositoryError from './utils/repositoryError';

@EntityRepository(IndividualAssignment)
export class IndividualAssignmentRepository extends Repository<IndividualAssignment> {
  public findAssignment(userId: string, experimentIds: string[]): Promise<IndividualAssignment[]> {
    const primaryKeys = experimentIds.map((experimentId) => {
      return `${experimentId}_${userId}`;
    });
    return this.createQueryBuilder('individualAssignment')
      .leftJoinAndSelect('individualAssignment.condition', 'condition')
      .leftJoinAndSelect('individualAssignment.experiment', 'experiment')
      .leftJoinAndSelect('individualAssignment.user', 'user')
      .whereInIds(primaryKeys)
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findAssignment',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async saveRawJson(
    rawData: Omit<IndividualAssignment, 'createdAt' | 'updatedAt' | 'versionNumber' | 'id'>
  ): Promise<IndividualAssignment> {
    // add the id here
    const id = `${rawData.experiment.id}_${rawData.user.id}`;
    const result = await this.createQueryBuilder('individualAssignment')
      .insert()
      .into(IndividualAssignment)
      .values({ id, ...rawData })
      .onConflict(`("id") DO UPDATE SET "conditionId" = :conditionId`)
      .setParameter('conditionId', rawData.condition.id)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async findIndividualAssignmentsByExperimentId(experimentId: string): Promise<IndividualAssignment[]> {
    return this.createQueryBuilder('individualAssignment')
      .leftJoinAndSelect('individualAssignment.experiment', 'experiment')
      .leftJoinAndSelect('individualAssignment.user', 'user')
      .leftJoinAndSelect('individualAssignment.condition', 'condition')
      .where('experiment.id = :experimentId', { experimentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findIndividualAssignmentsByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async deleteExperimentsForUserId(userId: string, experimentIds: string[]): Promise<IndividualAssignment[]> {
    const primaryKeys = experimentIds.map((experimentId) => {
      return `${experimentId}_${userId}`;
    });
    const result = await this.createQueryBuilder()
      .delete()
      .from(IndividualAssignment)
      .whereInIds(primaryKeys)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'deleteExperimentsForUserId',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
