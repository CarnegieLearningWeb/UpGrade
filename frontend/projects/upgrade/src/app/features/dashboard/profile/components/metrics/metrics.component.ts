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
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { METRICS_JOIN_TEXT, MetricUnit } from '../../../../../core/analysis/store/analysis.models';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { AddMetricsComponent } from '../modals/add-metrics/add-metrics.component';
import { METRIC_SEARCH_KEY } from '../../../../../../../../../../types/src/Experiment/enums';
import { IMetricUnit } from '../../../../../../../../../../types/src';
import { DeleteComponent } from '../../../../../shared/components/delete/delete.component';

// Extend IMetricUnit to include a function for lazy loading children
type LazyLoadingMetric = IMetricUnit & {
  loadChildren?: () => Promise<IMetricUnit[]>;
};

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

  // For displaying metrics
  allMetrics: any;
  allMetricsSub: Subscription;
  isAnalysisMetricsLoading$ = this.analysisService.isMetricsLoading$;

  // For tree structure
  _dataChange = new BehaviorSubject<MetricUnit[]>([]);
  nestedTreeControl: NestedTreeControl<MetricUnit | LazyLoadingMetric>;
  nestedDataSource = new MatTreeNestedDataSource<MetricUnit | LazyLoadingMetric>();

  selectedMetricIndex = null;
  metricFilterOptions = [METRIC_SEARCH_KEY.ALL, METRIC_SEARCH_KEY.NAME, METRIC_SEARCH_KEY.CONTEXT];
  selectedMetricFilterOption = METRIC_SEARCH_KEY.ALL;
  contextOptions: string[] = [];
  searchValue: string;

  constructor(private analysisService: AnalysisService, private authService: AuthService, private dialog: MatDialog) {
    // Initialize NestedTreeControl with custom getChildren method for lazy loading
    this.nestedTreeControl = new NestedTreeControl<MetricUnit | LazyLoadingMetric>(this.getChildren);
  }

  ngOnInit() {
    this.permissionSub = this.authService.userPermissions$.subscribe((permission) => {
      this.permissions = permission;
    });

    this.allMetricsSub = this.analysisService.allMetrics$.subscribe((metrics) => {
      this.allMetrics = new MatTableDataSource<LazyLoadingMetric>();
      // Process metrics data to prepare for lazy loading
      this.allMetrics.data = this.processMetricsData(metrics);
      this.extractContext(this.allMetrics.data);
    });

    this.applyFilter(this.searchValue);
  }

  // Determine if a node has nested children (either loadable or already loaded)
  hasNestedChild = (_: number, node: LazyLoadingMetric): boolean =>
    !!node.loadChildren || (node.children && node.children.length > 0);

  // Process a single metric node, setting up lazy loading for its children
  private insertNode(metric: IMetricUnit): LazyLoadingMetric {
    const processedMetric: LazyLoadingMetric = {
      ...metric,
      children: [],
    };

    // If the node has children, create a loadChildren function instead of processing them immediately
    if (metric.children && metric.children.length > 0) {
      processedMetric.loadChildren = () => Promise.resolve(metric.children?.map((child) => this.insertNode(child)));
    }

    return processedMetric;
  }

  // Custom method to get children for a node, supporting lazy loading
  private getChildren = (node: LazyLoadingMetric): Observable<LazyLoadingMetric[]> => {
    if (node.loadChildren) {
      return new Observable<LazyLoadingMetric[]>((observer) => {
        node
          .loadChildren()
          .then((children) => {
            node.children = children;
            observer.next(children);
            observer.complete();
          })
          .catch((error) => {
            observer.error(error);
          });
      });
    }
    return of(node.children || []);
  };

  // Process the entire metrics data to prepare for lazy loading
  private processMetricsData(metrics: IMetricUnit[]): LazyLoadingMetric[] {
    return metrics.map((item) => this.insertNode(item));
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
    const dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: 'delete-modal',
    });

    dialogRef.afterClosed().subscribe((isDeleteButtonClicked) => {
      if (isDeleteButtonClicked) {
        this.analysisService.deleteMetric(key.join(METRICS_JOIN_TEXT));
      }
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
