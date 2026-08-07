import { join } from 'path';
import { ValidationError } from 'class-validator';
import { SERVER_ERROR } from 'upgrade_types';

export function getOsEnv(key: string): string {
  if (typeof process.env[key] === 'undefined') {
    throw new Error(`Environment variable ${key} is not set.`);
  }

  return process.env[key] as string;
}

export function getOsEnvOptional(key: string): string | undefined {
  return process.env[key];
}

export function getPath(path: string): string {
  return process.env.NODE_ENV === 'production'
    ? join(process.cwd(), path.replace('src/', 'dist/src/').slice(0, -3) + '.js')
    : join(process.cwd(), path);
}

export function getPaths(paths: string[]): string[] {
  return paths.map((p) => getPath(p));
}

export function getOsPath(key: string): string {
  return getPath(getOsEnv(key));
}

export function getOsPaths(key: string): string[] {
  return getPaths(getOsEnvArray(key));
}

export function getOsEnvArray(key: string, delimiter = ','): string[] {
  return (process.env[key] && process.env[key].split(delimiter)) || [];
}

export function toNumber(value: string): number {
  return parseInt(value, 10);
}

export function toBool(value: string): boolean {
  return value === 'true';
}

export function normalizePort(port: string): number | string | boolean {
  const parsedPort = parseInt(port, 10);
  if (isNaN(parsedPort)) {
    // named pipe
    return port;
  }
  if (parsedPort >= 0) {
    // port number
    return parsedPort;
  }
  return false;
}

export function parseAdminUsers(value: string): Array<{ email: string; role: string }> {
  if (!value) {
    return [];
  }
  const adminDoc = value.split('/\\');
  return adminDoc.map((doc) => {
    const [email, role] = doc.split(':');
    return { email, role };
  });
}

export function formatBadReqErrorMessage(validationError: ValidationError[]): string {
  const formatErrors = [];
  validationError.forEach((error: ValidationError | ValidationError[]) => {
    if (error[`children`].length === 0) {
      formatErrors.push('in main object: ' + Object.values(error[`constraints`]).join(' or '));
    } else {
      const nestedElemError = error[`children`] as ValidationError[];
      nestedElemError.forEach((innerError: ValidationError) => {
        const keyPorperty = 'property';
        formatErrors.push(
          `in ${error[keyPorperty]} - ${innerError[keyPorperty]} inner object: ` +
            Object.values(innerError[`children`][0][`constraints`]).join(' or ')
        );
      });
    }
  });
  return SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' ===>  ' + formatErrors.join(', ');
}
