import { environment } from '../../../../environments/environment';

// see close-modal.interceptor.ts
export const ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE = [
  environment.api.addFlagInclusionList,
  environment.api.addFlagExclusionList,
];
