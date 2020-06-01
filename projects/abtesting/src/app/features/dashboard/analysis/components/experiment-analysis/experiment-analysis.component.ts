import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material';
import { MetricUnit, ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { Subscription, of } from 'rxjs';
import { OPERATION_TYPES } from 'upgrade_types';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { TreeData } from '../../../../../core/analysis/store/analysis.models';

@Component({
  selector: 'experiment-analysis',
  templateUrl: './experiment-analysis.component.html',
  styleUrls: ['./experiment-analysis.component.scss']
})
export class ExperimentAnalysisComponent implements OnInit, OnDestroy {

  allExperimentsInfo$ = this.experimentService.allExperimentNames$;
  analyticsForm: FormGroup;
  // For tree
  _dataChange = new BehaviorSubject<TreeData[]>([]);
  nestedTreeControl: NestedTreeControl<TreeData>;
  nestedDataSource: MatTreeNestedDataSource<TreeData>;
  insertNodeIndex = 0;
  selectedKey: TreeData;
  analysisData = [];
  analysisDataSub: Subscription;
  displayedConditionColumns = ['no', 'conditionCode', 'result'];

  selectedExperiment: ExperimentVM;
  selectExperimentByIdSub = new Subscription();

  queryOperations = [
    OPERATION_TYPES.SUM,
    OPERATION_TYPES.MIN,
    OPERATION_TYPES.MAX,
    OPERATION_TYPES.AVERAGE,
    OPERATION_TYPES.COUNT
  ];
  constructor(
    private experimentService: ExperimentService,
    private _formBuilder: FormBuilder,
    private analysisService: AnalysisService
  ) { }

  ngOnInit() {
    // Used to fetch all Experiment names
    this.experimentService.fetchAllExperimentNames();
    this.nestedTreeControl = new NestedTreeControl<TreeData>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();
    this.analyticsForm = this._formBuilder.group({
      experimentId: [null, Validators.required],
      operation: [null, Validators.required]
    });

    this.analyticsForm.get('experimentId').valueChanges.subscribe(selectedExperimentId => {
      this.selectExperimentByIdSub.add(this.experimentService.selectExperimentById(selectedExperimentId).subscribe(experiment => {
        this.selectedKey = null;
        if (experiment) {
          this.selectedExperiment = experiment;
          this.createTree(experiment.metrics);
        }
      }));
    });

    this._dataChange.subscribe(
      data => (this.nestedDataSource.data = data)
    );

    this.analysisDataSub = this.analysisService.analysisData$.subscribe(data => {
      this.analysisData = data;
    });
  }

  private _getChildren = (node: TreeData) => of(node.children);
  hasNestedChild = (_: number, nodeData: TreeData) => nodeData.children.length > 0;

  // TODO: Can be moved to  tree functions service
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
    metrics = {
      id: this.insertNodeIndex, key: metrics.key, children: metrics.children.map(data => {
        this.insertNodeIndex += 1;
        data = this.insertNode(data);
        return data;
      })
    };
    return metrics;
  }

  selectKey(node) {
    if (!node.children.length) {
      this.selectedKey = node;
    } else {
      this.selectedKey = null;
    }
  }

  fetchExperimentAnalysis() {
    const { experimentId, operation } = this.analyticsForm.value;
    const data = {
      children : this.nestedDataSource.data
    };
    const path = this.findParents(data, this.selectedKey.key);
    const query: any = {
      experimentId,
      operationTypes: operation,
      metrics: path
    };
    this.analysisService.fetchExperimentAnalysis(query);
  }

  findParents(node, searchForKey) {

    // If current node name matches the search name, return
    // empty array which is the beginning of our parent result
    if (node.key === searchForKey) {
      return []
    }

    // Otherwise, if this node has a tree field/value, recursively
    // process the nodes in this tree array
    if (Array.isArray(node.children)) {

      for (const treeNode of node.children) {

        // Recursively process treeNode. If an array result is
        // returned, then add the treeNode.key to that result
        // and return recursively
        const childResult = this.findParents(treeNode, searchForKey)

        if (Array.isArray(childResult)) {
          return [ treeNode.key ].concat( childResult );
        }
      }
    }
  }

  getConditionName(conditionId) {
    const condition = this.selectedExperiment.conditions.filter(
      con => con.id === conditionId
    )[0];
    return condition ? condition.conditionCode : '';
  }

  ngOnDestroy() {
    this.analysisService.setData(null);
    this.selectExperimentByIdSub.unsubscribe();
  }

}
