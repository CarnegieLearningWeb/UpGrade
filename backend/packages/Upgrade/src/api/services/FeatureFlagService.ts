import { Service } from 'typedi';
import { FeatureFlag } from '../models/FeatureFlag';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { getConnection } from 'typeorm';
import uuid from 'uuid';
import { FlagVariation } from '../models/FlagVariation';
import { FlagVariationRepository } from '../repositories/FlagVariationRepository';
import {
  IFeatureFlagSearchParams,
  IFeatureFlagSortParams,
  FLAG_SEARCH_SORT_KEY,
} from '../controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { SERVER_ERROR } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from '../controllers/validators/FeatureFlagValidator';

@Service()
export class FeatureFlagService {
  constructor(
    @OrmRepository() private featureFlagRepository: FeatureFlagRepository,
    @OrmRepository() private flagVariationRepository: FlagVariationRepository
  ) {}

  public find(logger: UpgradeLogger): Promise<FeatureFlag[]> {
    logger.info({ message: 'Get all feature flags' });
    return this.featureFlagRepository.find({ relations: ['variations'] });
  }

  public create(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: 'Create a new feature flag' });
    return this.addFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), logger);
  }

  public getTotalCount(): Promise<number> {
    return this.featureFlagRepository.count();
  }

  public findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: IFeatureFlagSearchParams,
    sortParams?: IFeatureFlagSortParams
  ): Promise<FeatureFlag[]> {
    logger.info({ message: 'Find paginated Feature flags' });

    let queryBuilder = this.featureFlagRepository
      .createQueryBuilder('feature_flag')
      .innerJoinAndSelect('feature_flag.variations', 'variations');
    if (searchParams) {
      const customSearchString = searchParams.string.split(' ').join(`:*&`);
      // add search query
      const postgresSearchString = this.postgresSearchString(searchParams.key);
      queryBuilder = queryBuilder
        .addSelect(`ts_rank_cd(to_tsvector('english',${postgresSearchString}), to_tsquery(:query))`, 'rank')
        .addOrderBy('rank', 'DESC')
        .setParameter('query', `${customSearchString}:*`);
    }
    if (sortParams) {
      queryBuilder = queryBuilder.addOrderBy(`feature_flag.${sortParams.key}`, sortParams.sortAs);
    }

    queryBuilder = queryBuilder.skip(skip).take(take);
    return queryBuilder.getMany();
  }

  public async delete(featureFlagId: string, logger: UpgradeLogger): Promise<FeatureFlag | undefined> {
    logger.info({ message: `Delete Feature Flag => ${featureFlagId}` });
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

  public update(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<FeatureFlag> {
    logger.info({ message: `Update a Feature Flag => ${flagDTO.toString()}` });
    // TODO add entry in log of updating feature flag
    return this.updateFeatureFlagInDB(this.featureFlagValidatorToFlag(flagDTO), logger);
  }

  private async addFeatureFlagInDB(flag: FeatureFlag, logger: UpgradeLogger): Promise<FeatureFlag> {
    const createdFeatureFlag = await getConnection().transaction(async (transactionalEntityManager) => {
      flag.id = uuid();
      const { variations, ...flagDoc } = flag;
      // saving experiment doc
      let featureFlagDoc: FeatureFlag;
      try {
        featureFlagDoc = (
          await this.featureFlagRepository.insertFeatureFlag(flagDoc as any, transactionalEntityManager)
        )[0];
      } catch (err) {
        const error = new Error(`Error in creating feature flag document "addFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
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

      // saving variations
      let variationDocs: FlagVariation[];
      try {
        variationDocs = await this.flagVariationRepository.insertVariations(
          variationDocsToSave,
          transactionalEntityManager
        );
      } catch (err) {
        const error = new Error(`Error in creating variation "addFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const variationDocToReturn = variationDocs.map((variationDoc) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { featureFlagId, ...rest } = variationDoc as any;
        return rest;
      });
      return { ...featureFlagDoc, variations: variationDocToReturn as any };
    });

    // TODO: Add log for feature flag creation
    return createdFeatureFlag;
  }

  private async updateFeatureFlagInDB(flag: FeatureFlag, logger: UpgradeLogger): Promise<FeatureFlag> {
    // get old feature flag document
    const oldFeatureFlag = await this.featureFlagRepository.find({
      where: { id: flag.id },
      relations: ['variations'],
    });
    const oldVariations = oldFeatureFlag[0].variations;

    return getConnection().transaction(async (transactionalEntityManager) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { variations, versionNumber, createdAt, updatedAt, ...flagDoc } = flag;
      let featureFlagDoc: FeatureFlag;
      try {
        featureFlagDoc = (await this.featureFlagRepository.updateFeatureFlag(flagDoc, transactionalEntityManager))[0];
      } catch (err) {
        const error = new Error(`Error in updating feature flag document "updateFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      // creating variations docs
      const variationDocToSave: Array<Partial<FlagVariation>> =
        (variations &&
          variations.length > 0 &&
          variations.map((variation: FlagVariation) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              return this.flagVariationRepository.upsertFlagVariation(variationDoc, transactionalEntityManager);
            })
          ) as any,
        ]);
      } catch (err) {
        const error = new Error(`Error in creating variations "updateFeatureFlagInDB" ${err}`);
        (error as any).type = SERVER_ERROR.QUERY_FAILED;
        logger.error(error);
        throw error;
      }

      const variationDocToReturn = variationDocs.map((variationDoc) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  private postgresSearchString(type: FLAG_SEARCH_SORT_KEY): string {
    const searchString: string[] = [];
    switch (type) {
      case FLAG_SEARCH_SORT_KEY.NAME:
        searchString.push("coalesce(feature_flag.name::TEXT,'')");
        searchString.push("coalesce(variations.value::TEXT,'')");
        break;
      case FLAG_SEARCH_SORT_KEY.KEY:
        searchString.push("coalesce(feature_flag.key::TEXT,'')");
        break;
      case FLAG_SEARCH_SORT_KEY.STATUS:
        searchString.push("coalesce(feature_flag.status::TEXT,'')");
        break;
      case FLAG_SEARCH_SORT_KEY.VARIATION_TYPE:
        // TODO: Update column name
        // searchString.push("coalesce(feature_flag.variationType::TEXT,'')");
        break;
      default:
        searchString.push("coalesce(feature_flag.name::TEXT,'')");
        searchString.push("coalesce(variations.value::TEXT,'')");
        searchString.push("coalesce(feature_flag.key::TEXT,'')");
        searchString.push("coalesce(feature_flag.status::TEXT,'')");
        // TODO: Update column name
        // searchString.push("coalesce(feature_flag.variationType::TEXT,'')");
        break;
    }
    const stringConcat = searchString.join(',');
    const searchStringConcatenated = `concat_ws(' ', ${stringConcat})`;
    return searchStringConcatenated;
  }

  private featureFlagValidatorToFlag(flagDTO: FeatureFlagValidation) {
    const featureFlag = new FeatureFlag();
    featureFlag.name = flagDTO.name;
    featureFlag.description = flagDTO.description;
    featureFlag.id = flagDTO.id;
    featureFlag.key = flagDTO.key;
    featureFlag.status = flagDTO.status;
    featureFlag.variationType = flagDTO.variationType;
    featureFlag.variations = flagDTO.variations?.map(variationDTO => {
      const featureFlagVariation = new FlagVariation();
      featureFlagVariation.name = variationDTO.name;
      featureFlagVariation.id = variationDTO.id;
      featureFlagVariation.defaultVariation = variationDTO.defaultVariation;
      featureFlagVariation.value = variationDTO.value;
      featureFlagVariation.description = variationDTO.description;
      featureFlagVariation.featureFlag = featureFlag;
      return featureFlagVariation;
    });
    return featureFlag
  }
}
