import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileRootComponent } from './profile-root/profile-root.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileRootComponent,
    data: { title: 'Profile' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
