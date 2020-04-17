import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { ProfileRootComponent } from './profile-root/profile-root.component';

@NgModule({
  declarations: [ProfileRootComponent],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    SharedModule
  ]
})
export class ProfileModule { }
