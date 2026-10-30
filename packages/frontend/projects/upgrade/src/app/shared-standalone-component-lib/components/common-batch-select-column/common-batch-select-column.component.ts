import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCellDef, MatColumnDef, MatHeaderCellDef, MatTable, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ObservedValueOf, Subscription } from 'rxjs';
import { BatchDeleteFacade } from '../../../core/batch-actions/batch-actions.facade';
import { RootBatchDeleteState } from '../../../core/batch-actions/batch-actions.models';

/** The selection parts of a batch facade that this column reads. */
export type BatchSelectionSource = Pick<BatchDeleteFacade, 'state$' | 'selection$' | 'toggleRow' | 'toggleHeader'>;

/**
 * Header and row selection checkboxes as one mat-table column. Place it inside a mat-table and add
 * its name ('select' by default) to the table's displayed columns.
 */
@Component({
  selector: 'app-common-batch-select-column',
  imports: [MatCheckboxModule, MatTableModule, MatTooltipModule, TranslateModule],
  templateUrl: './common-batch-select-column.component.html',
  styleUrl: './common-batch-select-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonBatchSelectColumnComponent implements OnInit, OnDestroy {
  @Input() batch: BatchSelectionSource;
  @Input() rowLabelKey: string;
  @Input() name = 'select';

  @ViewChild(MatColumnDef, { static: true }) columnDef: MatColumnDef;
  @ViewChild(MatHeaderCellDef, { static: true }) headerCell: MatHeaderCellDef;
  @ViewChild(MatCellDef, { static: true }) cell: MatCellDef;

  // The table renders these cells before this component's own template runs, so the cells read the
  // latest values from fields rather than from a template @let.
  selection: ObservedValueOf<BatchSelectionSource['selection$']>;
  batchState: RootBatchDeleteState;
  private subscriptions = new Subscription();

  constructor(private readonly table: MatTable<unknown>, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // mat-table only finds column definitions written directly inside it, so register this one
    // explicitly (the same approach as Material's mat-text-column).
    this.columnDef.name = this.name;
    this.columnDef.headerCell = this.headerCell;
    this.columnDef.cell = this.cell;
    this.table.addColumnDef(this.columnDef);

    this.subscriptions.add(
      this.batch.selection$.subscribe((selection) => {
        this.selection = selection;
        this.cdr.markForCheck();
      })
    );
    this.subscriptions.add(
      this.batch.state$.subscribe((batchState) => {
        this.batchState = batchState;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.table.removeColumnDef(this.columnDef);
  }
}
