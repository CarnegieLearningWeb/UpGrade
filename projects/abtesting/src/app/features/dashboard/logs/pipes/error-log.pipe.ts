import { Pipe, PipeTransform } from '@angular/core';
import { SERVER_ERROR } from 'ees_types';

@Pipe({
  name: 'errorLog'
})
export class ErrorLogPipe implements PipeTransform {
  transform(errorType: SERVER_ERROR, type: string): any {
    switch (errorType) {
      case SERVER_ERROR.DB_AUTH_FAIL:
      case SERVER_ERROR.DB_UNREACHABLE:
        return type === 'icon' ? 'shield' : 'light-blue';
      case SERVER_ERROR.ASSIGNMENT_ERROR:
        return type === 'icon' ? 'cancel' : 'red';
      case SERVER_ERROR.QUERY_FAILED:
      case SERVER_ERROR.INCORRECT_PARAM_FORMAT:
      case SERVER_ERROR.MISSING_PARAMS:
        return type === 'icon' ? 'database' : 'red';
      case SERVER_ERROR.USER_NOT_FOUND:
      case SERVER_ERROR.REPORTED_ERROR:
        return type === 'icon' ? 'user-2' : 'yellow';
      default:
        return type === 'icon' ? 'database' : 'red';
    }
  }
}
