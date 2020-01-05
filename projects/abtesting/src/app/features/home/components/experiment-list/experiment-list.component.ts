import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Experiment } from '../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { NewExperimentComponent } from '../modal/new-experiment/new-experiment.component';
import { ExperimentStatePipeType } from '../../pipes/experiment-state.pipe';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'name',
    'state',
    'experimentSegments',
    'startDate',
    'tags',
    'enrollment',
    'view'
  ];
  allExperiments: MatTableDataSource<Experiment>;
  allExperimentsSub: Subscription;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog
  ) {
    this.allExperimentsSub = this.experimentService.experiments$.subscribe(
      allExperiments => {
        this.allExperiments = new MatTableDataSource();
        this.allExperiments.data = allExperiments;
        this.allExperiments.paginator = this.paginator;
        this.allExperiments.sort = this.sort;
      }
    );
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

  openNewExperimentDialog() {
    const dialogRef = this.dialog.open(NewExperimentComponent, {
      width: '50%'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  ngOnDestroy() {
    this.allExperimentsSub.unsubscribe();
  }

  get ExperimentStatePipeTypes() {
    return ExperimentStatePipeType;
  }
}
