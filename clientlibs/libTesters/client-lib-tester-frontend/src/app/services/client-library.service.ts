import { Injectable } from '@angular/core';
import { UpgradeClient, ClientLibraryRef, availableClientLibraries } from '../client-library-data';

@Injectable({
  providedIn: 'root',
})
export class ClientLibraryService {
  private clientLibraries: ClientLibraryRef[] = [];

  constructor() {
    this.clientLibraries = availableClientLibraries;
  }

  // createClientLibraryInstance(version: string, params: UpgradeClientOptions): UpgradeClient {
  //   const clientLibrary = this.clientLibraries.find((clientLibrary) => clientLibrary.version === version);
  //   if (!clientLibrary) {
  //     throw new Error(`Client library version ${version} not found`);
  //   }

  //   return new clientLibrary.client(params.userId, params.hostURL);
  // }

  getClientConstructorByVersion(version: string): new (...args: any[]) => UpgradeClient {
    const clientLibrary = this.clientLibraries.find((clientLibrary) => clientLibrary.version === version);
    if (!clientLibrary) {
      throw new Error(`Client library version ${version} not found`);
    }

    return clientLibrary.client;
  }

  getClientLibraryVersions(): string[] {
    return this.clientLibraries.map((clientLibrary) => clientLibrary.version);
  }
}
