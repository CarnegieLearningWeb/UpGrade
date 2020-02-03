import { Pipe, PipeTransform } from '@angular/core';
import { ErrorLogTypes } from '../../../../core/audit/store/audit.model';

@Pipe({
  name: 'errorLog'
})
export class ErrorLogPipe implements PipeTransform {
  transform(errorType: ErrorLogTypes, type: string): any {
    switch (errorType) {
      case ErrorLogTypes.DATABASE_AUTH_FAIL:
      case ErrorLogTypes.DATABASE_NOT_REACHABLE:
        return type === 'icon' ? 'shield' : 'light-blue';
      case ErrorLogTypes.ERROR_IN_ASSIGNMENT_ALGORITHM:
        return type === 'icon' ? 'cancel' : 'red';
      case ErrorLogTypes.SERVER_NOT_REACHABLE:
        return type === 'icon' ? 'database' : 'red';
      case ErrorLogTypes.USER_ID_NOT_FOUND:
        return type === 'icon' ? 'user-2' : 'yellow';
      default:
        return type === 'icon' ? 'database' : 'red';
    }
  }
}
