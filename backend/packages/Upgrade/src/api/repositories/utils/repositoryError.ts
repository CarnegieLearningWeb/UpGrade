import { SERVER_ERROR } from 'upgrade_types';

export default function repositoryError(className: string, functionName: string, parameters: any, error: any): any {
  // adding extra information for debugging
  error.type = SERVER_ERROR.QUERY_FAILED;
  error.className = className;
  error.functionName = functionName;
  error.parameters = parameters;

  // send error message
  return error;
}
