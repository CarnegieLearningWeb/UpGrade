import { LIST_FILTER_MODE } from 'upgrade_types';

export function parseListFilterMode(filterMode: string | null | undefined): LIST_FILTER_MODE | undefined {
  const normalizedFilterMode = filterMode?.toLowerCase();

  if (normalizedFilterMode === LIST_FILTER_MODE.INCLUSION) {
    return LIST_FILTER_MODE.INCLUSION;
  }

  if (normalizedFilterMode === LIST_FILTER_MODE.EXCLUSION) {
    return LIST_FILTER_MODE.EXCLUSION;
  }

  return undefined;
}
