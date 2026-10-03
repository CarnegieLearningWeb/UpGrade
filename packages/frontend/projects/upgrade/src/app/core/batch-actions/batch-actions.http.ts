import { HttpContext } from '@angular/common/http';
import { SKIP_NAVIGATION_CANCEL } from '../http-interceptors/http-cancel.interceptor';

export const batchHttpContext = () => new HttpContext().set(SKIP_NAVIGATION_CANCEL, true);
