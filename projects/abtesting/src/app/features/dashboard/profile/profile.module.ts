import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ProfileRootComponent } from './profile-root/profile-root.component';
import { NewUserComponent } from './components/modals/new-user/new-user.component';
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { MetricsComponent } from './components/metrics/metrics.component';
import { AddMetricsComponent } from './components/modals/add-metrics/add-metrics.component';
import { DeleteMetricsComponent } from './components/modals/delete-metrics/delete-metrics.component';
import { NgJsonEditorModule } from 'ang-jsoneditor';

@NgModule({
  declarations: [
    ProfileRootComponent,
    NewUserComponent,
    ProfileInfoComponent,
    MetricsComponent,
    AddMetricsComponent,
    DeleteMetricsComponent
  ],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    SharedModule,
    NgJsonEditorModule
  ],
  entryComponents: [NewUserComponent, AddMetricsComponent, DeleteMetricsComponent]
})
export class ProfileModule {}
