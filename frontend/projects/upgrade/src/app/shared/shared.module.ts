import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTreeModule } from '@angular/material/tree';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
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
    MatChipsModule,
    MatCardModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatStepperModule,
    MatRadioModule,
    MatExpansionModule,
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
    MatTabsModule,
    MatChipsModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatSelectModule,
    MatToolbarModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatStepperModule,
    MatRadioModule,
    MatExpansionModule,
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
