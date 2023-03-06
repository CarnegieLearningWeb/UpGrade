import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private translateService: TranslateService) {}

  ngOnInit() {
    this.translateService.setDefaultLang('en');
    this.authService.initializeUserSession();
  }
}
