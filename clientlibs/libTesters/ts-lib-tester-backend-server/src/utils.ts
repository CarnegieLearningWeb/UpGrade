import { HookRequestBody } from '../../shared/models.js';
import { availableClientLibraries } from './app-config.js';

export function validateHook(body: HookRequestBody): boolean {
  const { name, user, libVersion, apiHostUrl, mockApp }: HookRequestBody = body;

  if (!name || !user || !libVersion || !apiHostUrl || !mockApp) {
    return false;
  }

  return true;
}

export function getUpgradeClientConstructor(version: string): any {
  const clientLibrary = availableClientLibraries.find(
    (clientLibrary: { version: string; client: any }) => clientLibrary.version === version
  );
  if (!clientLibrary || !clientLibrary.client || !clientLibrary.client.default) {
    throw new Error(`Client library version ${version} not found`);
  }

  return clientLibrary.client.default;
}
