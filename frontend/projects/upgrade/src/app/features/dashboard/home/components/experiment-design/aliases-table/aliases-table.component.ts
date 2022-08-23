import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ExperimentAliasTableRow } from '../../../../../../core/experiments/store/experiments.model';


@Component({
  selector: 'app-aliases-table',
  templateUrl: './aliases-table.component.html',
  styleUrls: ['./aliases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasesTableComponent implements OnInit {
  @Input() aliasTableData: BehaviorSubject<ExperimentAliasTableRow> = null;
  @Output() hideAliasTable: EventEmitter<boolean> = new EventEmitter();

  aliasesDisplayedColumns = [
    'site',
    'target',
    'condition',
    'alias',
    'actions'
  ]

  constructor() { }

  ngOnInit(): void {
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: ExperimentAliasTableRow) {
    rowData.isEditing = !rowData.isEditing;
    this.aliasTableData.next(this.aliasTableData.value);
  }
}
