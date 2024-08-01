import { SERVER_ERROR } from 'upgrade_types';

export interface NewErrorEvent {
  type: SERVER_ERROR | string;
  error: any;
  clear: () => void;
}
