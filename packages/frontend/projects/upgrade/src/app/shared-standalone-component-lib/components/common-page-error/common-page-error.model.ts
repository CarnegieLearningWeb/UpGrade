export enum PAGE_ERROR_TYPE {
  NOT_FOUND = 'notFound',
  LOAD_FAILED = 'loadFailed',
}

export interface DetailsPageError {
  entityId: string;
  errorType: PAGE_ERROR_TYPE;
}

export interface CommonPageErrorConfig {
  notFoundTitleKey: string;
  notFoundSubtitleKey: string;
  loadFailedTitleKey: string;
  loadFailedSubtitleKey: string;
  backButtonKey: string;
  backRoute: string;
}

// Lowercase-only on purpose: the app always generates lowercase UUIDs, and the selectors
// compare the route param against entity ids case-sensitively.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// A malformed id in the URL can never identify an entity, so details pages treat it as
// NOT_FOUND without a network call (the backend would reject it with 400, not 404).
export function isValidEntityId(id: string): boolean {
  return UUID_PATTERN.test(id);
}
