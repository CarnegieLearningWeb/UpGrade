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
   * `groupsForSession` and `includeStoredUserGroups` parameters:
   *
   * Note: provided session groups are never persisted
   *
   * **Scenario 1: Session-only groups (Ephemeral group user request)**
   * - `groupsForSession`: provided
   * - `includeStoredUserGroups`: explicitly `false`
   * - Behavior: Uses ONLY the provided session groups, ignoring any stored user groups
   * - Use case: Contexts where complete group information is preferred to be provided at runtime,
   *    rather reading from stored user groups.
   *
   * **Scenario 2: Merged groups (Merged stored/ephemeral groups request mode)**
   * - `groupsForSession`: provided
   * - `includeStoredUserGroups`: `true`
   * - Behavior: Merges session groups with stored user groups, if they don't already exist
   * - Use case: Adding temporary context while preserving existing user groups
   * - Note: This will 404 if user does not exist, as use cases would only exist for application
   *   contexts that are 'dependent' on another context to set complete user data.
   *
   * **Scenario 3: Default behavior (Standard mode)**
   * - `groupsForSession`: not provided or undefined
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
   * // Scenario 1: Standard lookup (no session params)
   * {
   *   context: "storedUserDependentContext",
   * }
   *
   * // Scenario 2: Ignore stored user and use session groups only
   * {
   *   context: "independentContext",
   *   groupsForSession: { "classId": ["testClass"], "schoolId": ["instructor"] },
   *   includeStoredUserGroups: false
   * }
   *
   * // Scenario 3: Merge session and stored groups
   * {
   *   context: "storedUserMergedContext",
   *   groupsForSession: { "classId": ["testClass"], "schoolId": ["demoSchool"] },
   *   includeStoredUserGroups: true
   * }
   *
   * ```
   */
  private async handleProvidedGroupsForSession(req: AppRequest, user_id: string): Promise<RequestedExperimentUser> {
    // Note: validation of request will have occurred before this middleware

    // Scenario 1: Session-only groups (ephemeral user mode)
    // explicitly check if includeStoredUserGroups is exactly false and not just undefined
    if (req.body.groupsForSession && req.body.includeStoredUserGroups === false) {
      req.logger.info({
        message: 'Using session-only groups (ephemeral user mode)',
      });

      return this.createSessionUser(user_id, req.body.groupsForSession);
    }

    // Load stored user document for scenarios 2 and 3
    const experimentUserDoc = await this.experimentUserService.getUserDoc(user_id, req.logger);

    // Scenario 2: Merged groups (Merged stored/ephemeral groups mode)
    if (req.body.includeStoredUserGroups && req.body.groupsForSession) {
      if (experimentUserDoc?.group) {
        experimentUserDoc.group = this.mergeGroupsWithUniqueValues(experimentUserDoc.group, req.body.groupsForSession);

        req.logger.info({
          message: 'Merged session groups with stored user groups',
          experimentUserDoc,
        });
      } else {
        req.logger.info({
          message: 'No stored groups found, using session groups only',
        });

        // If no stored groups exist, just use session groups
        return this.createSessionUser(user_id, req.body.groupsForSession);
      }
    } else {
      // Scenario 3: Standard behavior (user-lookup from user-id)
      req.logger.debug({
        message: 'Using standard user lookup without session group modifications',
        experimentUserDoc,
      });
    }

    return experimentUserDoc;
  }

  /**
   * Creates a RequestedExperimentUser object for session-only or ephemeral user scenarios.
   *
   * @param user_id - The user ID for the experiment user
   * @param groupsForSession - The groups provided in the session
   * @returns RequestedExperimentUser object with session groups
   */
  private createSessionUser(user_id: string, groupsForSession: Record<string, string[]>): RequestedExperimentUser {
    const sessionUser = new RequestedExperimentUser();
    sessionUser.id = user_id;
    sessionUser.requestedUserId = user_id;
    sessionUser.group = groupsForSession;
    sessionUser.workingGroup = undefined;
    return sessionUser;
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
