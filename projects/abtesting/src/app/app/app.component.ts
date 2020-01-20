import browser from 'browser-detect';
import { Component, OnInit } from '@angular/core';
import { environment as env } from '../../environments/environment';
import {
  routeAnimations,
  LocalStorageService,
} from '../core/core.module';
import { SettingsService } from '../core/settings/settings.service';
import { AuthService } from '../core/auth/auth.service';
import { ExperimentService } from '../core/experiments/experiments.service';
import { ThemeOptions } from '../core/settings/store/settings.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent implements OnInit {
  isProd = env.production;
  envName = env.envName;
  version = env.versions.app;
  year = new Date().getFullYear();
  languages = ['en', 'de', 'sk', 'fr', 'es', 'pt-br', 'zh-cn', 'he'];
  navigation = [
    { link: 'about', label: 'app.menu.about' },
    { link: 'feature-list', label: 'app.menu.features' },
    { link: 'examples', label: 'app.menu.examples' }
  ];
  navigationSideMenu = [
    ...this.navigation,
    { link: 'settings', label: 'app.menu.settings' }
  ];

  themeOptions = [
    { value: ThemeOptions.DEFAULT_THEME, viewValue: 'Default' },
    { value: ThemeOptions.DARK_THEME, viewValue: 'Dark' },
    { value: ThemeOptions.LIGHT_THEME, viewValue: 'Light' },
    { value: ThemeOptions.NATURE_THEME, viewValue: 'Nature' }
  ];

  theme$ = this.settingsService.theme$;
  constructor(
    private storageService: LocalStorageService,
    private settingsService: SettingsService,
    private authService: AuthService,
    private experimentService: ExperimentService
  ) {}

  private static isIEorEdgeOrSafari() {
    return ['ie', 'edge', 'safari'].includes(browser().name);
  }

  ngOnInit(): void {
    this.storageService.testLocalStorage();
    this.experimentService.loadExperiments();
    if (AppComponent.isIEorEdgeOrSafari()) {
      this.settingsService.changeAnimationsPageDisabled(true);
    }
  }

  onLoginClick() {
    this.authService.authLogin();
  }

  onLogoutClick() {
    this.authService.authLogout();
  }

  onLanguageSelect({ value: language }) {
    this.settingsService.changeLanguage(language);
  }

  changeTheme(theme) {
    this.settingsService.changeTheme(theme);
  }
}
