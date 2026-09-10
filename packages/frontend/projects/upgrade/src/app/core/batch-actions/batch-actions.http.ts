import { HttpContext } from '@angular/common/http';
import { SKIP_NAVIGATION_CANCEL } from '../http-interceptors/http-cancel.interceptor';
import { HANDLES_BATCH_ERRORS_CONTEXTUALLY } from '../http-interceptors/http-context-tokens';

export const batchHttpContext = () =>
  new HttpContext().set(SKIP_NAVIGATION_CANCEL, true).set(HANDLES_BATCH_ERRORS_CONTEXTUALLY, true);
