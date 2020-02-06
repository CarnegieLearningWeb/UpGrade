export default function repositoryError(className: string, functionName: string, parameters: any, error: any): string {
  const errorMessage = {
    ['Class Name']: className,
    ['Function Name']: functionName,
    ['Parameters']: parameters,
    ['Error']: error,
  };

  return JSON.stringify(errorMessage, undefined, 2);
}
