import { SERVER_ERROR } from 'upgrade_types';

export default function repositoryError(className: string, functionName: string, parameters: any, error: any): string {
  const errorMessage = {
    ['Class Name']: className,
    ['Function Name']: functionName,
    ['Parameters']: parameters,
    ['Error']: error,
  };

  const message = JSON.stringify(errorMessage, undefined, 2);

  // send error message
  return(JSON.stringify({ type: SERVER_ERROR.QUERY_FAILED, message }));
}
