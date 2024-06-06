import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ContentDetail, KeyValueFormat } from 'upgrade_types';

@Injectable({
  providedIn: 'root',
})
export class CommonFormHelpersService {
  triggerTouchedToDisplayErrors(form: FormGroup) {
    Object.keys(form.controls).forEach((field) => {
      const control = form.get(field);
      control.markAsTouched({ onlySelf: true });
    });
  }

  convertObjectFormat(obj: KeyValueFormat): ContentDetail[] {
    return Object.keys(obj).map((key) => {
      let keyString = key;
      if (key.includes('_')) {
        keyString = this.convertToTitleCase(key);
      }
      return {
        key: keyString,
        value: obj[key],
      };
    });
  }

  convertToTitleCase(key: string): string {
    return key
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
