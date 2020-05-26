import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TreeNodeDialogComponent } from '../modal/tree-node-dialog/tree-node-dialog.component';
import { BehaviorSubject, of } from 'rxjs';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource, MatDialog } from '@angular/material';
import { TreeFunctionService } from '../../services/tree-functions.service';
import { ExperimentVM, MetricUnit } from '../../../../../core/experiments/store/experiments.model';

export interface TreeData {
  id: number;
  key: string;
  children: TreeData[];
}

@Component({
  selector: 'experiment-metric-common',
  templateUrl: './metric-common.component.html',
  styleUrls: ['./metric-common.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCommonComponent implements OnInit, OnChanges {
  @Input() experimentInfo: ExperimentVM;
  @Output() metricUpdationEvent = new EventEmitter<MetricUnit[]>();
  _dataChange = new BehaviorSubject<TreeData[]>([]);
  nestedTreeControl: NestedTreeControl<TreeData>;
  nestedDataSource: MatTreeNestedDataSource<TreeData>;
  keyEditMode = true;

  // New node
  nameKey: string;
  insertNodeIndex = 0;

  constructor(
    private service: TreeFunctionService,
    public dialog: MatDialog,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experimentInfo && this.experimentInfo) {
      this.createTree(this.experimentInfo.metrics);
    }
  }

  ngOnInit() {
    this.nestedTreeControl = new NestedTreeControl<TreeData>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();
    this._dataChange.subscribe(
      data => (this.nestedDataSource.data = data)
    );
  }

  private _getChildren = (node: TreeData) => of(node.children);
  hasNestedChild = (_: number, nodeData: TreeData) => nodeData.children.length > 0;

  refreshTreeData() {
    const data = this.nestedDataSource.data;
    this.nestedDataSource.data = null;
    this.nestedDataSource.data = data;
    this.metricUpdationEvent.emit(this.mapKeyData(data));
  }

  addNode(node: TreeData) {
    node.id = this.service.findNodeMaxId(this.nestedDataSource.data) + 1;
    this.nestedDataSource.data.push(node);
    this.refreshTreeData();
  }

  addChildNode(childrenNodeData) {
    childrenNodeData.node.id = this.service.findNodeMaxId(this.nestedDataSource.data) + 1;
    childrenNodeData.currentNode.children.push(childrenNodeData.node);
    this.refreshTreeData();
  }

  editNode(nodeToBeEdited) {
    const fatherElement: TreeData = this.service.findParentNode(nodeToBeEdited.currentNode.id, this.nestedDataSource.data);
    let elementPosition: number;
    nodeToBeEdited.node.id = this.service.findNodeMaxId(this.nestedDataSource.data) + 1;
    if (fatherElement[0]) {
      fatherElement[0].children[fatherElement[1]] = nodeToBeEdited.node;
    } else {
      elementPosition = this.service.findPosition(nodeToBeEdited.currentNode.id, this.nestedDataSource.data);
      this.nestedDataSource.data[elementPosition] = nodeToBeEdited.node;
    }
    this.refreshTreeData();
  }

  deleteNode(nodeToBeDeleted: TreeData) {
    const deletedElement: TreeData = this.service.findParentNode(nodeToBeDeleted.id, this.nestedDataSource.data);
    let elementPosition: number;
    if (deletedElement[0]) {
      deletedElement[0].children.splice(deletedElement[1], 1);
    } else {
      elementPosition = this.service.findPosition(nodeToBeDeleted.id, this.nestedDataSource.data);
      this.nestedDataSource.data.splice(elementPosition, 1);
    }
    this.refreshTreeData();
  }

  openAddNodeDialog(currentNode?: TreeData): void {
    const dialogRef = this.dialog.open(TreeNodeDialogComponent, {
      panelClass: 'tree-modal',
      data: { nodeName: this.nameKey, component: 'Add' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const node: TreeData = {
          id: null,
          key: result.nodeName,
          children: []
        };
        if (!currentNode) {
          this.addNode(node);
        } else {
          this.addChildNode({ currentNode, node });
        }
      }
    });
  }

  openEditNodeDialog(currentNode: TreeData) {
    const dialogRef = this.dialog.open(TreeNodeDialogComponent, {
      panelClass: 'tree-modal',
      data: { name: currentNode.key, component: 'Edit' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const node: TreeData = {
          id: null,
          key: result.nodeName,
          children: currentNode.children
        };
        this.editNode({ currentNode, node });
      }
    });
  }

  changeMetricMode(event) {
    this.keyEditMode = !event.checked;
  }

  mapKeyData(metrics: TreeData[]): MetricUnit[] {
    return metrics.map(metric => this.mapData(metric));
  }

  // Recursive call to convert data in key, children pair
  mapData(metric: any) {
    if (!metric.children.length) {
      return { key: metric.key, children: metric.children };
    }
    metric = { key: metric.key, children: metric.children.map(data => {
      data = this.mapData(data);
      return data;
    })};
    return metric;
  }

  createTree(metrics: MetricUnit[]): void {
    const tree = metrics.map(metric => this.insertNode(metric));
    this._dataChange.next(tree);
  }

  insertNode(metrics: any): TreeData {
    if (!metrics.children.length) {
      const data = { id: this.insertNodeIndex, key: metrics.key, children: metrics.children };
      this.insertNodeIndex += 1;
      return data;
    }
    metrics = { id: this.insertNodeIndex, key: metrics.key, children: metrics.children.map(data => {
      this.insertNodeIndex += 1;
      data = this.insertNode(data);
      return data;
    })};
    return metrics;
  }
}
