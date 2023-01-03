import { Injectable } from '@angular/core';
import { IKeyValueBubbleStyles, KEY_VALUE_BUBBLE_STYLE_PRESETS } from './key-value-bubble.model';

@Injectable({
  providedIn: 'root',
})
export class KeyValueBubbleService {
  instancesOpen = [];

  public registerViewerInstance(key: string): IKeyValueBubbleStyles {
    const formattedkey = this.formatNameForKeyCache(key);
    this.instancesOpen.push(formattedkey);
    const cachedStyles = this.getFromCache(formattedkey);
    if (cachedStyles) {
      return cachedStyles;
    } else {
      const styles = KEY_VALUE_BUBBLE_STYLE_PRESETS[this.instancesOpen.length - 1];

      console.log(`added ${key} to tracked bubble list`);
      this.setToCache(formattedkey, styles);
      return styles;
    }
  }

  private formatNameForKeyCache(key: string) {
    return key
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s{2,}/g, ' ');
  }

  public getFromCache(key: string) {
    const formattedkey = this.formatNameForKeyCache(key);
    console.log(`get key ${key}`);
    const fetchedData = localStorage.getItem(formattedkey);
    if (fetchedData) {
      const deserializedValue = JSON.parse(fetchedData);
      console.log(`found ${deserializedValue} at key ${formattedkey}`);
      return deserializedValue;
    } else {
      console.log(`no date found at key ${formattedkey}`);

      return undefined;
    }
  }

  public setToCache(key: string, value: IKeyValueBubbleStyles) {
    const formattedkey = this.formatNameForKeyCache(key);
    const serializedValue = JSON.stringify(value);
    console.log(`save ${serializedValue} to key ${formattedkey}`);
    localStorage.setItem(formattedkey, serializedValue);
  }
}
