import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export interface IMarkDecisionPointParams {
  site: string;
  target: string | null;
  condition: string;
  status: MARKED_DECISION_POINT_STATUS;
  uniquifier?: string;
  clientError?: string;
}
