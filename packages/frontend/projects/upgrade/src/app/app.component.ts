import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth/auth.service';
import { HashRoutingNavigationService } from './core/hash-routing-navigation/hash-routing-navigation.service';
import { TranslateService } from '@ngx-translate/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly hashRoutingNavigationService: HashRoutingNavigationService,
    private readonly translateService: TranslateService,
    private readonly overlayContainer: OverlayContainer
  ) {}

  ngOnInit() {
    this.translateService.setDefaultLang('en');
    this.authService.initializeUserSession();
    this.overlayContainer.getContainerElement().classList.add('light-theme');
    this.hashRoutingNavigationService.initializeHashRouting();
  }
}
