import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Redirects incomplete detail URLs to their list page when the id route param is empty.
 *
 * A trailing slash (e.g. `/home/detail/`) matches the `:experimentId` param with an empty
 * string, which would otherwise leave the details page waiting for a fetch that never
 * happens. Redirecting mirrors the wildcard behavior of the same URL without the slash.
 */
export const requireRouteParam =
  (paramName: string, redirectTo: string): CanActivateFn =>
  (route) =>
    route.paramMap.get(paramName) ? true : inject(Router).parseUrl(redirectTo);
