/**
 * Configuration interface for entity-specific timeline behavior.
 *
 * This model enables the CommonAuditLogTimelineComponent to display audit logs
 * for different entity types (experiments, feature flags, segments) by providing
 * entity-specific message maps and behavior functions.
 *
 * @example
 * ```typescript
 * const experimentConfig: TimelineLogTypeConfig = {
 *   logTypeMessageMap: {
 *     [LOG_TYPE.EXPERIMENT_CREATED]: 'logs.audit-log-experiment-created.text',
 *     ...
 *   },
 *   isSimpleLogType: (type) => [LOG_TYPE.EXPERIMENT_DELETED, ...].includes(type),
 *   ...
 * };
 * ```
 */

/**
 * Entity-specific configuration for timeline log display.
 */
export interface AuditLogTimelineConfig {
  /**
   * Mapping of log type enum values to i18n translation keys.
   * Used to display the appropriate message for each log action.
   *
   * Example: \{ 'EXPERIMENT_CREATED': 'logs.audit-log-experiment-created.text' \}
   */
  logTypeMessageMap: Record<string, string>;

  /**
   * Optional mapping of log type enum values to human-readable display labels for filter menus.
   * When present, these labels are shown in the filter dropdown instead of the raw enum value.
   *
   * Example: \{ 'experimentCreated': 'Experiment Created' \}
   */
  logTypeDisplayLabelMap?: Record<string, string>;

  /**
   * Optional mapping for list operation types (inclusion/exclusion lists).
   * Only needed if the entity supports list operations.
   *
   * Example: \{ 'CREATED': 'logs.audit-log-list-created.text' \}
   */
  listOperationMessageMap?: Record<string, string>;

  /**
   * Determines if a log type should be displayed as a simple message
   * without expandable diff panels (e.g., deleted, exported logs).
   *
   * @param type - The log type as a string
   * @returns true if the log should be displayed simply
   */
  isSimpleLogType: (type: string) => boolean;

  /**
   * Determines if a log type represents a state change or creation event.
   * These logs may display additional state information (old state → new state).
   *
   * @param type - The log type as a string
   * @returns true if the log is a state change or creation event
   */
  isStateChangeOrCreated: (type: string) => boolean;

  /**
   * Checks if the log data contains a list operation (inclusion/exclusion).
   *
   * @param logData - The log's data object
   * @returns true if the log contains a list operation
   */
  hasListOperation: (logData: any) => boolean;

  /**
   * Determines if a log type represents an update operation.
   * Update logs typically have expandable diff displays.
   *
   * @param type - The log type as a string
   * @returns true if the log is an update operation
   */
  isUpdateLogType?: (type: string) => boolean;

  /**
   * Determines if the log data represents a filter mode (include-all) change,
   * i.e. no diff and no list operation, but a filterMode field is present.
   *
   * @param logData - The log's data object
   * @returns true if the log is a filter mode update
   */
  isFilterModeUpdate?: (logData: any) => boolean;

  /**
   * Extracts the entity name (e.g., experiment name, feature flag name) from log data.
   * When provided, the name is displayed after the action message in the log entry.
   * On context-specific timelines (e.g., the experiment detail page) this should return null
   * since the entity name is already implied by the page context.
   *
   * @param logData - The log's data object
   * @returns The entity name string, or null if not applicable
   */
  getEntityName?: (logData: any) => string | null;

  /**
   * Returns the router link array for navigating to the entity's detail page.
   * Should return null if the entity no longer exists or navigation is not applicable.
   * When null but getEntityName returns a value, the name is shown as plain text.
   *
   * @param logData - The log's data object
   * @returns Router link segments (e.g., ['/home', 'detail', id]) or null
   */
  getEntityLink?: (logData: any) => string[] | null;
}

/**
 * Complete timeline configuration including system settings and entity-specific behavior.
 */
// export interface TimelineConfig {
//   /**
//    * Email address used to identify system-generated logs.
//    * System logs are displayed with a special icon.
//    */
//   systemUserEmail: string;

//   /**
//    * Entity-specific configuration for log type handling and message display.
//    */
//   entityConfig: TimelineLogTypeConfig;
// }
