import { Component } from '@angular/core';
import {
  CommonDialogComponent,
  ExampleDialogFormTemplateComponent,
} from '@upgrade/src/app/shared-standalone-component-lib/components';

@Component({
  selector: 'app-example-projected-content',
  standalone: true,
  imports: [CommonDialogComponent, ExampleDialogFormTemplateComponent],
  templateUrl: './example-projected-content.component.html',
  styleUrl: './example-projected-content.component.scss',
})
export class ExampleProjectedContentComponent {}
