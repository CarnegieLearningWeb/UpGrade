import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MetricUnit } from '../../../../../core/analysis/store/analysis.models';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { DeleteMetricsComponent } from '../modals/delete-metrics/delete-metrics.component';
import { AddMetricsComponent } from '../modals/add-metrics/add-metrics.component';
import { METRIC_SEARCH_KEY } from '../../../../../../../../../../types/src/Experiment/enums';
import { IMetricUnit } from '../../../../../../../../../../types/src';

@Component({
  selector: 'profile-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('metricsTable') metricsTable: ElementRef;

  permissions: UserPermission;
  permissionSub: Subscription;

  displayedColumns = ['metric', 'context'];
  keyEditMode = true;

  // Used for displaying metrics
  allMetrics: any;
  allMetricsSub: Subscription;
  isAnalysisMetricsLoading$ = this.analysisService.isMetricsLoading$;

  // For tree structure
  _dataChange = new BehaviorSubject<MetricUnit[]>([]);
  nestedTreeControl = new NestedTreeControl<IMetricUnit>((node) => node.children);
  nestedDataSource = new MatTreeNestedDataSource<IMetricUnit>();
  insertNodeIndex = 0;

  selectedMetricIndex = null;
  metricFilterOptions = [METRIC_SEARCH_KEY.ALL, METRIC_SEARCH_KEY.NAME, METRIC_SEARCH_KEY.CONTEXT];
  selectedMetricFilterOption = METRIC_SEARCH_KEY.ALL;
  contextOptions: string[] = [];
  searchValue: string;

  constructor(private analysisService: AnalysisService, private authService: AuthService, private dialog: MatDialog) {}

  ngOnInit() {
    this.permissionSub = this.authService.userPermissions$.subscribe((permission) => {
      this.permissions = permission;
    });

    this.allMetricsSub = this.analysisService.allMetrics$.subscribe((metrics) => {
      this.allMetrics = new MatTableDataSource();
      this.allMetrics.data = metrics.map((item) => {
        this.insertNodeIndex = 0;
        return this.insertNode(item);
      });
      this.extractContext(this.allMetrics.data);
    });

    this.applyFilter(this.searchValue);
  }

  hasNestedChild = (_: number, nodeData: IMetricUnit) => !!nodeData.children && nodeData.children.length > 0;

  insertNode(metrics: any): MetricUnit {
    if (!metrics.children.length) {
      const data = { id: this.insertNodeIndex, ...metrics };
      this.insertNodeIndex += 1;
      return data;
    }
    metrics = {
      id: this.insertNodeIndex,
      ...metrics,
      children: metrics.children.map((data) => {
        this.insertNodeIndex += 1;
        data = this.insertNode(data);
        return data;
      }),
    };
    return metrics;
  }

  openAddMetricDialog() {
    this.selectedMetricIndex = null;
    const dialogRef = this.dialog.open(AddMetricsComponent, {
      panelClass: 'add-metric-modal',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // Code will be executed after closing dialog
    });
  }

  deleteNode(nodeToBeDeleted: any, index: number) {
    const data = {
      children: [this.allMetrics.data[index]],
    };
    const key = this.analysisService.findParents(data, nodeToBeDeleted.id);
    this.selectedMetricIndex = null;
    this.dialog.open(DeleteMetricsComponent, {
      panelClass: 'delete-modal',
      data: { key },
    });
  }

  setSearchKey(searchKey: METRIC_SEARCH_KEY) {
    this.analysisService.setMetricsFilterValue(searchKey);
  }

  applyFilter(filterValue: string) {
    this.filterMetricsPredicate(this.selectedMetricFilterOption);
    if (typeof filterValue === 'string') {
      this.allMetrics.filter = filterValue.trim().toLowerCase();
    }
  }
  filterMetricsPredicate(type: METRIC_SEARCH_KEY) {
    this.allMetrics.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case METRIC_SEARCH_KEY.ALL:
          return (
            (filter !== METRIC_SEARCH_KEY.ALL ? data.key.toLocaleLowerCase().includes(filter) : data.key) ||
            !!data.context.filter((context) => context.toLocaleLowerCase().includes(filter)).length
          );
        case METRIC_SEARCH_KEY.NAME:
          return filter !== METRIC_SEARCH_KEY.NAME ? data.key.toLocaleLowerCase().includes(filter) : data.key;

        case METRIC_SEARCH_KEY.CONTEXT:
          return !!data.context.filter((context) => context.toLocaleLowerCase().includes(filter)).length;
      }
    };
  }
  changeMetricMode(event) {
    this.keyEditMode = !event.checked;
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.metricsTable.nativeElement.style.maxHeight = windowHeight - 440 + 'px';
  }

  ngOnDestroy() {
    this.analysisService.setMetricsFilterValue(null);
    this.allMetricsSub.unsubscribe();
    this.permissionSub.unsubscribe();
  }

  extractContextRecursively(obj: any, contextValuesSet: Set<string>) {
    if (obj.context && Array.isArray(obj.context)) {
      obj.context.forEach((value: string) => contextValuesSet.add(value));
    }
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach((child: any) => this.extractContextRecursively(child, contextValuesSet));
    }
  }

  extractContext(data: any[]): void {
    const contextValuesSet = new Set<string>(); // Using Set to automatically remove duplicates

    // Call the recursive function
    data.forEach((item) => this.extractContextRecursively(item, contextValuesSet));

    this.contextOptions = Array.from(contextValuesSet); // Convert Set back to array
  }
}
