import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-aliases-table',
  templateUrl: './aliases-table.component.html',
  styleUrls: ['./aliases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AliasesTableComponent implements OnInit {
  @Input() aliasTableData = [];
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
}
