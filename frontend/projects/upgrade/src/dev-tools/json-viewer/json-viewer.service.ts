import { Injectable } from '@angular/core';
import { IJsonViewerStyles, VIEW_STYLE_CONSTANTS } from './json-viewer.model';

@Injectable({
  providedIn: 'root',
})
export class JsonViewerService {
  instancesOpen = [];

  public registerViewerInstance(id: string): IJsonViewerStyles {
    const formattedId = this.formatNameForKeyCache(id);
    this.instancesOpen.push(formattedId);
    const cachedStyles = this.getFromCache(formattedId);
    if (cachedStyles) {
      return cachedStyles;
    } else {
      const styles = VIEW_STYLE_CONSTANTS[this.instancesOpen.length - 1];

      console.log(`added ${id} to jsonviewers`);
      this.setToCache(formattedId, styles);
      return styles;
    }
  }

  private formatNameForKeyCache(id: string) {
    return id
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s{2,}/g, ' ');
  }

  public getFromCache(id: string) {
    const formattedId = this.formatNameForKeyCache(id);
    console.log(`get key ${id}`);
    const fetchedData = localStorage.getItem(formattedId);
    if (fetchedData) {
      const deserializedValue = JSON.parse(fetchedData);
      console.log(`found ${deserializedValue} at key ${formattedId}`);
      return deserializedValue;
    } else {
      console.log(`no date found at key ${formattedId}`);

      return undefined;
    }
  }

  public setToCache(id: string, value: IJsonViewerStyles) {
    const formattedId = this.formatNameForKeyCache(id);
    const serializedValue = JSON.stringify(value);
    console.log(`save ${serializedValue} to key ${formattedId}`);
    localStorage.setItem(formattedId, serializedValue);
  }
}
