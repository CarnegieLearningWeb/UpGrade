import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { Subscription, BehaviorSubject, of } from 'rxjs';
import { MatTableDataSource, MatTreeNestedDataSource, MatDialog } from '@angular/material';
import { MetricUnit } from '../../../../../core/analysis/store/analysis.models';
import { NestedTreeControl } from '@angular/cdk/tree';
import { DeleteMetricComponent } from '../modal/delete-metric/delete-metric.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { UserPermission } from '../../../../../core/auth/store/auth.models';

@Component({
  selector: 'analysis-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit, AfterViewInit, OnDestroy {
  permissions: UserPermission;
  permissionSub: Subscription;

  displayedColumns = ['id', 'metric'];
  keyEditMode = true;

  // Used for displaying metrics
  allMetrics: any;
  allMetricsSub: Subscription;
  isAnalysisMetricsLoading$ = this.analysisService.isMetricsLoading$;

  // For tree structure
  _dataChange = new BehaviorSubject<MetricUnit[]>([]);
  nestedTreeControl: NestedTreeControl<MetricUnit>;
  nestedDataSource: MatTreeNestedDataSource<MetricUnit>;
  insertNodeIndex = 0;

  selectedMetricIndex = null;

  @ViewChild('metricsTable', { static: false }) metricsTable: ElementRef;

  constructor(
    private analysisService: AnalysisService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.permissionSub = this.authService.userPermissions$.subscribe(permission => {
      this.permissions = permission;
    });

    this.allMetricsSub = this.analysisService.allMetrics$.subscribe(metrics => {
      this.allMetrics = new MatTableDataSource();
      this.allMetrics.data = metrics;
    });

    this.nestedTreeControl = new NestedTreeControl<MetricUnit>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    this._dataChange.subscribe(
      data => (this.nestedDataSource.data = data)
    );
  }

  private _getChildren = (node: MetricUnit) => of(node.children);
  hasNestedChild = (_: number, nodeData: MetricUnit) => nodeData.children.length > 0;

  createTree(metrics: MetricUnit[]): void {
    const tree = metrics.map(metric => this.insertNode(metric));
    this._dataChange.next(tree);
  }

  insertNode(metrics: any): MetricUnit {
    if (!metrics.children.length) {
      const data = { id: this.insertNodeIndex, ...metrics };
      this.insertNodeIndex += 1;
      return data;
    }
    metrics = {
      id: this.insertNodeIndex, ...metrics, children: metrics.children.map(data => {
        this.insertNodeIndex += 1;
        data = this.insertNode(data);
        return data;
      })
    };
    return metrics;
  }

  deleteNode(nodeToBeDeleted: any) {
    const data = {
      children: this.nestedDataSource.data
    }
    const key = this.analysisService.findParents(data, nodeToBeDeleted.id);
    this.selectedMetricIndex = null;
    const dialogRef = this.dialog.open(DeleteMetricComponent, {
      panelClass: 'delete-modal',
      data: { key }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after deleting metric
    });
  }

  setTreeForMetric(index: number) {
    this.selectedMetricIndex = index;
    this.insertNodeIndex = 0;
    this.createTree([this.allMetrics.data[index]]);
  }

  applyFilter(filterValue: string) {
    this.selectedMetricIndex = null;
    this.analysisService.setMetricsFilterValue(filterValue);
  }

  changeMetricMode(event) {
    this.keyEditMode = !event.checked;
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.metricsTable.nativeElement.style.maxHeight = (windowHeight - 325) + 'px';
  }

  ngOnDestroy() {
    this.analysisService.setMetricsFilterValue(null);
    this.allMetricsSub.unsubscribe();
    this.permissionSub.unsubscribe();
  }
}
