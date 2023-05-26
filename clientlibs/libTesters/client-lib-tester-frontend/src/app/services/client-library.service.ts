import { Injectable } from '@angular/core';
import { UpgradeClient, ClientLibraryRef, availableClientLibraries } from '../client-library-data';

@Injectable({
  providedIn: 'root',
})
export class ClientLibraryService {
  private clientLibraries: ClientLibraryRef[] = [];
  private selectedClientLibraryVersion = '';
  private selectedAPIHostUrl = '';

  constructor() {
    this.clientLibraries = availableClientLibraries;
  }

  getSelectedClientLibraryVersion(): string {
    return this.selectedClientLibraryVersion;
  }

  setSelectedClientLibraryVersion(version: string): void {
    console.log('setting version', version);
    this.selectedClientLibraryVersion = version;
  }

  getSelectedAPIHostUrl(): string {
    return this.selectedAPIHostUrl;
  }

  setSelectedAPIHostUrl(url: string): void {
    this.selectedAPIHostUrl = url;
  }

  getUpgradeClientConstructor(): new (...args: any[]) => UpgradeClient {
    const version = this.getSelectedClientLibraryVersion();
    const clientLibrary = this.clientLibraries.find(
      (clientLibrary) => clientLibrary.version === this.getSelectedClientLibraryVersion()
    );
    if (!clientLibrary) {
      throw new Error(`Client library version ${version} not found`);
    }

    return clientLibrary.client;
  }

  getClientLibraryVersions(): string[] {
    return this.clientLibraries.map((clientLibrary) => clientLibrary.version);
  }
}
