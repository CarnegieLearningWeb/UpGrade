import { Component, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Experiment } from '../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../core/experiments/experiments.service';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'state', 'experimentSegments', 'startDate', 'tags', 'enrollment', 'view'];
  allExperiments: MatTableDataSource<Experiment>;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private experimentService: ExperimentService) {
    this.experimentService.experiments$.subscribe(allExperiments => {
      this.allExperiments = new MatTableDataSource(allExperiments);
    });
  }

  ngOnInit() {
    this.allExperiments.paginator = this.paginator;
    this.allExperiments.sort = this.sort;
  }

  // TODO: Update experiment filter logic
  applyFilter(filterValue: string) {
    this.allExperiments.filter = filterValue.trim().toLowerCase();

    if (this.allExperiments.paginator) {
      this.allExperiments.paginator.firstPage();
    }
  }
}
