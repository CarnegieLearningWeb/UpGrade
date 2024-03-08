import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonDialogService } from 'upgrade/src/app/shared/services/common-dialog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // // in a service, each would open a different dialog
  openDialog() {
    const dialogRef = this.dialogService.openExampleDialog();

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }

  constructor(public dialogService: CommonDialogService) {}
}
