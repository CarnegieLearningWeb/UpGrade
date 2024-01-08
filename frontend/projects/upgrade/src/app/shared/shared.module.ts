import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTreeModule } from '@angular/material/tree';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { DevToolsModule } from '../../dev-tools/dev-tools.module';

import { SharedIconsComponent } from './components/shared-icons/shared-icons.component';
import { TruncatePipe } from './pipes/truncate.pipe';
import { ExperimentStatePipe } from './pipes/experiment-state.pipe';
import { FormatDatePipe } from './pipes/format-date.pipe';
import { ScrollDirective } from './directives/scroll.directive';
import { OperationPipe } from './pipes/operation.pipe';
import { SegmentStatusPipe } from './pipes/segment-status.pipe';
import { QueryResultComponent } from './components/query-result/query-result.component';
import { DeleteComponent } from './components/delete/delete.component';
import { MatConfirmDialogComponent } from './components/mat-confirm-dialog/mat-confirm-dialog.component';

import { environment } from '../../environments/environment';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatListModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatStepperModule,
    MatRadioModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatTreeModule,
    environment.production ? [] : DevToolsModule,
  ],
  declarations: [
    SharedIconsComponent,
    TruncatePipe,
    ExperimentStatePipe,
    ScrollDirective,
    FormatDatePipe,
    OperationPipe,
    QueryResultComponent,
    DeleteComponent,
    SegmentStatusPipe,
    MatConfirmDialogComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatMenuModule,
    MatTabsModule,
    MatChipsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatSelectModule,
    MatToolbarModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatSliderModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatStepperModule,
    MatRadioModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatTreeModule,
    SharedIconsComponent,
    TruncatePipe,
    ExperimentStatePipe,
    FormatDatePipe,
    ScrollDirective,
    OperationPipe,
    QueryResultComponent,
    DeleteComponent,
    SegmentStatusPipe,
    MatConfirmDialogComponent,
    environment.production ? [] : DevToolsModule,
  ],
})
export class SharedModule {}
