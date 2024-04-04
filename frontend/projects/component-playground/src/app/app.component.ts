import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import * as SharedComponentLib from '@shared-standalone-component-lib/components';
import { BlankAppStateComponent } from './blank-app-state/blank-app-state.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatDialogModule,
    BlankAppStateComponent,
    SharedComponentLib.CommonRootPageComponent,
    SharedComponentLib.CommonSectionCardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
}
