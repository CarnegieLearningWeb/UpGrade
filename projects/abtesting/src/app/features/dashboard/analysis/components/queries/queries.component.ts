import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material';

@Component({
  selector: 'analysis-queries',
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueriesComponent implements OnInit, AfterViewInit, OnDestroy {

  displayedColumns = ['id', 'metric', 'operation', 'execute'];

  // Used for displaying metrics
  allQueries: any;
  allQueriesSub: Subscription;
  isAnalysisQueriesLoading$ = this.analysisService.isQueriesLoading$;

  @ViewChild('queriesTable', { static: false }) metricsTable: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  constructor(
    private analysisService: AnalysisService,
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

  executeQuery(query) {
    console.log('Query', query);
    this.analysisService.executeQuery(query);
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
}
