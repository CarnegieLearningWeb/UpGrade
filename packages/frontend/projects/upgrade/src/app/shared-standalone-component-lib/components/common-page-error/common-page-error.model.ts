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

// The canonical form of an entity id in this app: the lowercase subset of what the
// backend's @IsUUID() accepts (UUID versions 1-8 plus the nil/max UUIDs). Lowercase-only
// on purpose - the app always generates lowercase UUID URLs, and the selectors compare
// the route param against entity ids case-sensitively.
const CANONICAL_UUID_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

// Detail routes intentionally support canonical lowercase ids only; other forms are
// treated as NOT_FOUND without a network call to keep route/store comparisons deterministic.
export function isCanonicalEntityId(id: string): boolean {
  return CANONICAL_UUID_PATTERN.test(id);
}
