import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonDialogService } from '@shared-standalone-component-lib/services/common-dialog.service';
import * as SharedComponentLib from '@shared-standalone-component-lib/components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatDialogModule,
    SharedComponentLib.CommonDialogComponent,
    SharedComponentLib.ExampleDialogFormTemplateComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  openDialog() {
    // use the dialog service to pick a dialog to pop for this button
    const dialogRef = this.dialogService.openExampleDialog();

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }

  constructor(public dialogService: CommonDialogService) {}
}
