import { NUMBER_OF_LOGS } from './store/logs.model';

export class LogsPagination {

  // Return skip and take value based on fromStart
  // fromStart indicates whether to fetch logs from starting position or not
  static getLogParameters(skip: number, fromStart: boolean) {
    return ({ skip: fromStart ? 0 : skip, take: NUMBER_OF_LOGS });
  }
}
