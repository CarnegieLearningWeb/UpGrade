import { Title } from '@angular/platform-browser';
import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  constructor(
    private translateService: TranslateService,
    private title: Title,
    @Inject(ENV) private environment: Environment
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
        .pipe(filter((translatedTitle) => translatedTitle !== title))
        .subscribe((translatedTitle) => this.title.setTitle(`${this.environment.appName} - ${translatedTitle}`));
    } else {
      this.title.setTitle(this.environment.appName);
    }
  }
}
