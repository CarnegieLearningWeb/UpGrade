import * as express from 'express';
import { SettingService } from '../services/SettingService';
import { SERVER_ERROR } from 'upgrade_types';
import { AppRequest } from '../../types';
import { Service } from 'typedi';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { RequestedExperimentUser } from '../controllers/validators/ExperimentUserValidator';

@Service()
export class UserCheckMiddleware {
  constructor(public settingService: SettingService, public experimentUserService: ExperimentUserService) {}

  public async use(req: AppRequest, res: AppRequest, next: express.NextFunction): Promise<any> {
    try {
      const user_id = req.get('User-Id');
      if (!user_id) {
        const error = new Error(`User-Id header not found.`);
        (error as any).type = SERVER_ERROR.MISSING_HEADER_USER_ID;
        (error as any).httpCode = 400;
        req.logger.error(error);
        return next(error);
      } else {
        req.logger.child({ user_id });
        req.logger.debug({ message: 'User Id is:', user_id });
      }

      let experimentUserDoc: RequestedExperimentUser;

      if (req.url.endsWith('/v6/featureflag')) {
        experimentUserDoc = await this.handleProvidedGroupsForSession(req, user_id);
      } else {
        experimentUserDoc = await this.experimentUserService.getUserDoc(user_id, req.logger);
        if (!req.url.endsWith('/init') && !experimentUserDoc) {
          const error = new Error(`User not found: ${user_id}`);
          (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
          (error as any).httpCode = 404;
          req.logger.error(error);
          return next(error);
        }
      }
      req.userDoc = experimentUserDoc;
      // Continue to the next middleware/controller
      return next();
    } catch (error) {
      req.logger.error(error);
      return next(error);
    }
  }

  /**
   * Handles potential ephemeral session groups provided in the request.
   *
   * This method processes different scenarios based on the combination of
   * `provideGroupsForSession` and `includeStoredUserGroups` parameters:
   *
   * Note: provided session groups are never persisted
   *
   * **Scenario 1: Session-only groups (Ephemeral group user request)**
   * - `provideGroupsForSession`: provided
   * - `includeStoredUserGroups`: explicitly `false`
   * - Behavior: Uses ONLY the provided session groups, ignoring any stored user groups
   * - Use case: Contexts where complete group information is preferred to be provided at runtime,
   *    rather reading from stored user groups.
   *
   * **Scenario 2: Merged groups (Merged stored/ephemeral groups request mode)**
   * - `provideGroupsForSession`: provided
   * - `includeStoredUserGroups`: `true`
   * - Behavior: Merges session groups with stored user groups, if they don't already exist
   * - Use case: Adding temporary context while preserving existing user groups
   * - Note: This will not 404. This could be undesired behavior if the ephemeral session groups
   *     are not a complete set of relevant groups for the user, such as globally excluded user groups
   *     in a production environment that are required to be present in the stored user groups.
   *
   * **Scenario 3: Default behavior (Standard mode)**
   * - `provideGroupsForSession`: not provided or undefined
   * - `includeStoredUserGroups`: not provided or undefined
   * - Behavior: Uses standard user lookup with stored groups only
   * - Use case: Normal feature flag evaluation without session context
   *
   * @param req - The application request containing session group parameters
   * @param user_id - The user identifier for group lookup
   * @returns Promise resolving to RequestedExperimentUser with appropriate group configuration
   *
   * @example
   * ```typescript
   * // Scenario 1: Ignore stored user and use session groups only
   * {
   *   userId: "user123",
   *   context: "independentContext",
   *   provideGroupsForSession: { "classId": ["advanced"], "role": ["instructor"] },
   *   includeStoredUserGroups: false
   * }
   *
   * // Scenario 2: Merge session and stored groups
   * {
   *   userId: "user123",
   *   context: "storedUserMergedContext",
   *   provideGroupsForSession: { "classId": ["testClass"], "schoolId": ["demoSchool"] },
   *   includeStoredUserGroups: true
   * }
   *
   * // Scenario 3: Standard lookup (no session params)
   * {
   *   userId: "user123",
   *   context: "storedUserDependentContext",
   * }
   * ```
   */
  private async handleProvidedGroupsForSession(req: AppRequest, user_id: string): Promise<RequestedExperimentUser> {
    let experimentUserDoc: RequestedExperimentUser;

    // Note: validation of request will have occurred before this middleware

    // Scenario 1: Session-only groups (ephemeral user mode)
    // explicitly check if includeStoredUserGroups is exactly false and not just undefined
    if (req.body.provideGroupsForSession && req.body.includeStoredUserGroups === false) {
      req.logger.info({
        message: 'Using session-only groups (ephemeral user mode)',
      });

      experimentUserDoc = new RequestedExperimentUser();
      experimentUserDoc.group = req.body.provideGroupsForSession;
      experimentUserDoc.requestedUserId = user_id;
      experimentUserDoc.id = user_id; // Use user_id as the document ID
      return Promise.resolve(experimentUserDoc);
    }

    // Load stored user document for scenarios 2 and 3
    experimentUserDoc = await this.experimentUserService.getUserDoc(user_id, req.logger);

    // Scenario 2: Merged groups (Merged stored/ephemeral groups mode)
    if (req.body.includeStoredUserGroups && req.body.provideGroupsForSession) {
      if (experimentUserDoc?.group) {
        experimentUserDoc.group = this.mergeGroupsWithUniqueValues(
          experimentUserDoc.group,
          req.body.provideGroupsForSession
        );

        req.logger.info({
          message: 'Merged session groups with stored user groups',
          experimentUserDoc,
        });
      } else {
        // If no stored groups exist, just use session groups
        experimentUserDoc.group = req.body.provideGroupsForSession;

        req.logger.info({
          message: 'No stored groups found, using session groups only',
        });
      }
    } else {
      // Scenario 3: Standard behavior (user-lookup from user-id)
      req.logger.debug({
        message: 'Using standard user lookup without session group modifications',
        experimentUserDoc,
      });
    }

    return Promise.resolve(experimentUserDoc);
  }

  /**
   * Merges two group objects with unique values per key.
   *
   * This utility method combines existing user groups with incoming session groups,
   * ensuring no duplicate values exist within each group key's array.
   *
   * @param existing - The existing user groups (may be undefined)
   * @param incoming - The incoming session groups to merge
   * @returns A new object with merged groups containing unique values
   *
   * @example
   * ```typescript
   * const existing = { "classId": ["123", "xyz"], "schoolId": ["qwerty"] };
   * const incoming = { "classId": ["abc", "123"], "instructorId": ["dale123"] };
   * const merged = mergeGroupsWithUniqueValues(existing, incoming);
   * // Result: {
   * //   "classId": ["123", "xyz", "abc"],
   * //   "schoolId": ["qwerty"],
   * //   "instructorId": ["dale123"]
   * // }
   * ```
   */
  private mergeGroupsWithUniqueValues(
    existing: Record<string, string[]> | undefined,
    incoming: Record<string, string[]>
  ): Record<string, string[]> {
    const result: Record<string, string[]> = { ...existing };

    for (const [key, values] of Object.entries(incoming)) {
      if (result[key]) {
        result[key] = [...new Set([...result[key], ...values])];
      } else {
        result[key] = [...values];
      }
    }

    return result;
  }
}
