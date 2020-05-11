import { Service } from 'typedi';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { FeatureFlag } from '../models/FeatureFlag';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { User } from '../models/User';
import { getConnection } from 'typeorm';
import uuid from 'uuid';
import { FlagVariation } from '../models/FlagVariation';
import { FlagVariationRepository } from '../repositories/FlagVariationRepository';

@Service()
export class FeatureFlagService {
  constructor(
    @Logger(__filename) private log: LoggerInterface,
    @OrmRepository() private featureFlagRepository: FeatureFlagRepository,
    @OrmRepository() private flagVariationRepository: FlagVariationRepository
  ) { }

  public find(): Promise<FeatureFlag[]> {
    this.log.info('Get all feature flags');
    return this.featureFlagRepository.find({ relations: ['variations'] });
  }

  public create(flag: FeatureFlag, currentUser: User): Promise<FeatureFlag> {
    this.log.info('Create a new feature flag');
    return this.addFeatureFlagInDB(flag, currentUser);
  }

  public async delete(featureFlagId: string, currentUser: User): Promise<FeatureFlag | undefined> {
    this.log.info('Delete Feature Flag => ', featureFlagId);
    const featureFlag = await this.featureFlagRepository.find({
      where: { id: featureFlagId },
      relations: ['variations'],
    });

    if (featureFlag) {
      const deletedFlag = await this.featureFlagRepository.deleteById(featureFlagId);

      // TODO: Add entry in audit log for delete feature flag
      return deletedFlag;
    }

    return undefined;
  }

  public async updateState(flagId: string, status: boolean): Promise<FeatureFlag> {
    // TODO: Add log for updating flag state
    const updatedState = await this.featureFlagRepository.updateState(flagId, status);
    return updatedState;
  }

  public update(id: string, flag: FeatureFlag, currentUser: User): Promise<FeatureFlag> {
    this.log.info('Update a Feature Flag => ', flag.toString());
    // TODO add entry in log of updating feature flag
    return this.updateFeatureFlagInDB(flag, currentUser);
  }

  private async addFeatureFlagInDB(flag: FeatureFlag, currentUser: User): Promise<FeatureFlag> {
    const createdFeatureFlag = await getConnection().transaction(async (transactionalEntityManager) => {
      flag.id = uuid();
      const { variations, ...flagDoc } = flag;
      // saving experiment doc
      let featureFlagDoc: FeatureFlag;
      try {
        featureFlagDoc = (
          await this.featureFlagRepository.insertFeatureFlag(flagDoc as any, transactionalEntityManager)
        )[0];
      } catch (error) {
        throw new Error(`Error in creating feature flag document "addFeatureFlagInDB" ${error}`);
      }

      // creating variations docs
      const variationDocsToSave =
        variations &&
        variations.length > 0 &&
        variations.map((variation: FlagVariation) => {
          variation.id = variation.id || uuid();
          variation.featureFlag = featureFlagDoc;
          return variation;
        });

        console.log('Variation doc', variationDocsToSave);

      // saving variations
      let variationDocs: FlagVariation[];
      try {
        variationDocs = await this.flagVariationRepository.insertVariations(variationDocsToSave, transactionalEntityManager);
      } catch (error) {
        throw new Error(`Error in creating variation "addFeatureFlagInDB" ${error}`);
      }

      const variationDocToReturn = variationDocs.map((variationDoc) => {
        const { featureFlagId, ...rest } = variationDoc as any;
        return rest;
      });

      return { ...featureFlagDoc, variations: variationDocToReturn as any };
    });

    // TODO: Add log for feature flag creation

    return createdFeatureFlag;
  }

  private async updateFeatureFlagInDB(flag: FeatureFlag, user: User): Promise<FeatureFlag> {
    // get old feature flag document
    const oldFeatureFlag = await this.featureFlagRepository.find({
      where: { id: flag.id },
      relations: ['variations'],
    });
    const oldVariations = oldFeatureFlag[0].variations;

    return getConnection().transaction(async (transactionalEntityManager) => {
      const { variations, versionNumber, createdAt, updatedAt, ...flagDoc } = flag;
      let featureFlagDoc: FeatureFlag;
      try {
        featureFlagDoc = (await this.featureFlagRepository.updateFeatureFlag(flagDoc, transactionalEntityManager))[0];
      } catch (error) {
        throw new Error(`Error in updating feature flag document "updateFeatureFlagInDB" ${error}`);
      }

      // creating variations docs
      const variationDocToSave: Array<Partial<FlagVariation>> =
        (variations &&
          variations.length > 0 &&
          variations.map((variation: FlagVariation) => {
            // tslint:disable-next-line:no-shadowed-variable
            const { createdAt, updatedAt, versionNumber, ...rest } = variation;
            rest.featureFlag = featureFlagDoc;
            rest.id = rest.id || uuid();
            return rest;
          })) ||
        [];

      // delete variations which don't exist in new  feature flag document
      const toDeleteVariations = [];
      oldVariations.forEach(({ id }) => {
        if (
          !variationDocToSave.find((doc) => {
            return doc.id === id;
          })
        ) {
          toDeleteVariations.push(this.flagVariationRepository.deleteVariation(id, transactionalEntityManager));
        }
      });

      // delete old variations
      await Promise.all(toDeleteVariations);

      // saving variations
      let variationDocs: FlagVariation[];
      try {
        [variationDocs] = await Promise.all([
          Promise.all(
            variationDocToSave.map(async (variationDoc) => {
              return this.flagVariationRepository.upsertFlagVariation(
                variationDoc,
                transactionalEntityManager
              );
            })
          ) as any,
        ]);
      } catch (error) {
        throw new Error(`Error in creating variations "updateFeatureFlagInDB" ${error}`);
      }

      const variationDocToReturn = variationDocs.map((variationDoc) => {
        const { featureFlagId, ...rest } = variationDoc as any;
        return { ...rest, featureFlag: variationDoc.featureFlag };
      });

      const newFeatureFlag = {
        ...featureFlagDoc,
        variations: variationDocToReturn as any,
      };

      // add log of diff of new and old feature flag doc
      return newFeatureFlag;
    });
  }
}
