import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export class CustomTranslateHttpLoader extends TranslateHttpLoader {
  constructor(http: HttpClient, prefix?: string, suffix?: string) {
    super(http, prefix, suffix);
  }

  override getTranslation(lang: string): Observable<any> {
    return super.getTranslation(lang).pipe(
      catchError((error) => {
        console.error(`Error loading translation file for language "${lang}":`, error);
        return throwError(error);
      })
    );
  }
}

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new CustomTranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(appRoutes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
