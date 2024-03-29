import { UpGradeClientInterfaces } from 'types';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export interface IMarkDecisionPointParams {
  site: string;
  target: string;
  condition: string;
  status: MARKED_DECISION_POINT_STATUS;
  uniquifier?: string;
  clientError?: string;
}

export interface IConfigOptions {
  token?: string;
  clientSessionId?: string;
  httpClient?: UpGradeClientInterfaces.IHttpClientWrapper;
}
