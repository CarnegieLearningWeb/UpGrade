import { Injectable } from '@angular/core';
import { ClientLibraryRef, availableClientLibraries } from '../app-config';

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
    console.log('[Setting Library version]', version);
    this.selectedClientLibraryVersion = version;
  }

  getSelectedAPIHostUrl(): string {
    return this.selectedAPIHostUrl;
  }

  setSelectedAPIHostUrl(url: string): void {
    console.log('[Setting API Host Url]', url);
    this.selectedAPIHostUrl = url;
  }

  getUpgradeClientConstructor(): any {
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
