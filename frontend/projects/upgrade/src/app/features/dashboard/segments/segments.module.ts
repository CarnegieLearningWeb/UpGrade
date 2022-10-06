import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegmentsRoutingModule } from './segments-routing.module';
import { SegmentsRootComponent } from './segments-root/segments-root.component';
import { SharedModule } from '../../../shared/shared.module';
import { SegmentsListComponent } from './components/segments-list/segments-list.component';
import { NewSegmentComponent } from './components/modal/new-segment/new-segment.component';
import { SegmentOverviewComponent } from './components/segment-overview/segment-overview.component';
import { SegmentMembersComponent } from './components/segment-members/segment-members.component';
import { ViewSegmentComponent } from './pages/view-segment/view-segment.component';
import { DeleteSegmentComponent } from './components/modal/delete-segment/delete-segment.component';
import { DuplicateSegmentComponent } from './components/modal/duplicate-segment/duplicate-segment.component';
import { ImportSegmentComponent } from './components/modal/import-segment/import-segment.component';
import { ImportMembersComponent } from './components/modal/import-members/import-members.component';
import { SegmentExperimentListComponent } from './components/modal/segment-experiment-list/segment-experiment-list.component';
@NgModule({
  declarations: [
    SegmentsRootComponent,
    SegmentsListComponent,
    NewSegmentComponent,
    SegmentOverviewComponent,
    SegmentMembersComponent,
    ViewSegmentComponent,
    DeleteSegmentComponent,
    DuplicateSegmentComponent,
    ImportSegmentComponent,
    ImportMembersComponent,
    SegmentExperimentListComponent,
  ],
  imports: [
    CommonModule,
    SegmentsRoutingModule,
    SharedModule
  ],
  providers: [SegmentMembersComponent],
  entryComponents: [
    NewSegmentComponent,
    DeleteSegmentComponent,
    ImportSegmentComponent,
    ImportMembersComponent,
    DuplicateSegmentComponent,
    SegmentExperimentListComponent,
    SegmentMembersComponent
  ]
})
export class SegmentsModule { }
