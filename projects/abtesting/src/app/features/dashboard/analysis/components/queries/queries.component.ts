import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { Subscription } from 'rxjs';
import { MatTableDataSource, MatDialog } from '@angular/material';
import { METRICS_JOIN_TEXT } from '../../../../../core/analysis/store/analysis.models';
import { QueryResultComponent } from '../../../../../shared/components/query-result/query-result.component';

@Component({
  selector: 'analysis-queries',
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.scss']
})
export class QueriesComponent implements OnInit, AfterViewInit, OnDestroy {

  displayedColumns = ['id', 'queryName', 'experimentName', 'metric', 'operation', 'execute', 'edit', 'delete'];

  // Used for displaying metrics
  allQueries: any;
  allQueriesSub: Subscription;
  isAnalysisQueriesLoading$ = this.analysisService.isQueriesLoading$;

  @ViewChild('queriesTable', { static: false }) metricsTable: ElementRef;

  constructor(
    private analysisService: AnalysisService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.allQueriesSub = this.analysisService.allQueries$.subscribe(queries => {
      this.allQueries = new MatTableDataSource();
      this.allQueries.data = queries;
    });
  }

  applyFilter(filterValue: string) {
    this.analysisService.setQueriesFilterValue(filterValue);
  }

  executeQuery(query: any) {
    const dialogRef = this.dialog.open(QueryResultComponent, {
      panelClass: 'query-result',
      data: { experiment: null, query }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after deleting experiment
    });
  }

  editQuery(query: any) {
    console.log('Edit query', query);
  }

  deleteQuery(query: any) {
    this.analysisService.deleteQuery(query.id);
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.metricsTable.nativeElement.style.maxHeight = (windowHeight - 402) + 'px';
  }

  ngOnDestroy() {
    this.analysisService.setQueriesFilterValue(null);
    this.allQueriesSub.unsubscribe();
  }

  get METRICS_JOIN_TEXT() {
    return METRICS_JOIN_TEXT;
  }
}
