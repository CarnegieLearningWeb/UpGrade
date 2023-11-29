import { HookRequestBody } from '../../shared/models';
import { availableClientLibraries } from './app-config';

export function validateHook(body: HookRequestBody): boolean {
  const { name, user, libVersion, apiHostUrl, mockApp }: HookRequestBody = body;

  if (!name || !user || !libVersion || !apiHostUrl || !mockApp) {
    return false;
  }

  return true;
}

export function getUpgradeClientConstructor(version: string): any {
  console.log({ availableClientLibraries });
  const clientLibrary = availableClientLibraries.find(
    (clientLibrary: { version: string; client: any }) => clientLibrary.version === version
  );
  if (!clientLibrary || !clientLibrary.client) {
    throw new Error(`Client library version ${version} not found`);
  }

  return clientLibrary.client?.default || clientLibrary.client;
}
