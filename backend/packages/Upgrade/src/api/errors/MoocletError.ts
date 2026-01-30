import { SERVER_ERROR } from 'upgrade_types';
import { ErrorWithType } from './ErrorWithType';

export class MoocletError extends ErrorWithType {
  public httpCode: number;

  constructor(message: string, httpCode = 500) {
    super();
    this.message = message;
    this.type = SERVER_ERROR.MOOCLET_ERROR;
    this.httpCode = httpCode;
    this.name = 'MoocletError';
  }
}
