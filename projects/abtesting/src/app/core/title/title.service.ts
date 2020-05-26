import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { environment as env } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  constructor(
    private translateService: TranslateService,
    private title: Title
  ) {}

  setTitle(snapshot: ActivatedRouteSnapshot) {
    let lastChild = snapshot;
    while (lastChild.children.length) {
      lastChild = lastChild.children[0];
    }
    const { title } = lastChild.data;
    const translate = this.translateService;
    if (title) {
      translate
        .get(title)
        .pipe(filter(translatedTitle => translatedTitle !== title))
        .subscribe(translatedTitle =>
          this.title.setTitle(`${env.appName} - ${translatedTitle}`)
        );
    } else {
      this.title.setTitle(env.appName);
    }
  }
}
