import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonDialogService } from '@shared-standalone-component-lib/services/common-dialog.service';
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
  openDialog() {
    // use the dialog service to pick a dialog to pop for this button
    const dialogRef = this.dialogService.openCommonProjectedDialog();

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }

  constructor(public dialogService: CommonDialogService, private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
}
