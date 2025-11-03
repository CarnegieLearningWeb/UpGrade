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
      }

      if (!req.url.endsWith('/init') && !experimentUserDoc) {
        const error = new Error(`User not found: ${user_id}`);
        (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
        (error as any).httpCode = 404;
        req.logger.error(error);
        return next(error);
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
   * **Stored-user Mode** (Standard stored user lookup):
   * - Omit both `groupsForSession` and `includeStoredUserGroups` parameters
   * - Uses only stored user groups from the database
   * - User must already have been initialized, will 404 if user does not exist
   *
   * **Ephemeral Mode** (Session-only groups):
   * - Set `includeStoredUserGroups` to `false` and provide `groupsForSession`
   * - Uses only the groups provided in the session, ignoring any stored user groups.
   * - Does not require the user to be initialized (it will bypass stored user lookup)
   * - Useful when complete group information is always provided at runtime.
   *
   * **Merged Mode** (Stored + Session groups):
   * - Set `includeStoredUserGroups` to `true` and provide `groupsForSession`
   * - User must already have been initialized, will 404 if user does not exist.
   * - Session groups are merged with stored groups if they don't already exist for stored user.
   * - Session groups are never persisted.
   * - Useful for adding context-specific ephemeral groups to an existing user.
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
      const experimentUserDoc = this.createSessionUser(user_id, req.body.groupsForSession);

      req.logger.debug({
        message: 'Created ephemeral user with session groups',
        experimentUserDoc,
      });

      return experimentUserDoc;
    }

    // Load stored user document, required for scenarios 2 and 3
    const experimentUserDoc = await this.experimentUserService.getUserDoc(user_id, req.logger);

    if (!experimentUserDoc) {
      return null; // User not found, will be handled in the main middleware
    }

    if (req.body.groupsForSession && req.body.includeStoredUserGroups) {
      // Scenario 2: Merged groups (Merged stored/ephemeral groups mode)
      experimentUserDoc.group = this.mergeGroupsWithUniqueValues(experimentUserDoc.group, req.body.groupsForSession);

      req.logger.debug({
        message: 'Merged session groups with stored user groups',
        experimentUserDoc,
      });
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
   * Creates a RequestedExperimentUser object for ephemeral user scenarios.
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
