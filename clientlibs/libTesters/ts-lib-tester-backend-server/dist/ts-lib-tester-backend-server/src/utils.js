import { availableClientLibraries } from './app-config.js';
export function validateHook(body) {
    const { hook, user, libVersion, apiHostUrl, mockApp } = body;
    if (!hook || !user || !libVersion || !apiHostUrl || !mockApp) {
        return false;
    }
    return true;
}
export function getUpgradeClientConstructor(version) {
    const clientLibrary = availableClientLibraries.find((clientLibrary) => clientLibrary.version === version);
    if (!clientLibrary) {
        throw new Error(`Client library version ${version} not found`);
    }
    return clientLibrary.client;
}
//# sourceMappingURL=utils.js.map