import { SERVER_ERROR } from 'upgrade_types';

export class ErrorWithType extends Error {
  public type: SERVER_ERROR;
  constructor() {
    super();
  }
}
