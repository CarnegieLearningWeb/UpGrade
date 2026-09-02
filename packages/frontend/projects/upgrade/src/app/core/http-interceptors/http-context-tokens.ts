import { HttpContextToken } from '@angular/common/http';

// Requests that render their own not-found state (e.g. details pages) set this token
// so a 404 doesn't also trigger the generic error notification.
// Kept in its own file so data services can import it without pulling in the
// interceptor's dependency graph (AuthService -> CoreModule), which is circular.
export const HANDLES_404_CONTEXTUALLY = new HttpContextToken<boolean>(() => false);
