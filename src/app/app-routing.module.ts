import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { TableDetailComponent } from './table-detail/table-detail.component';

const routes: Routes = [
  {
    path: 'homePage',
    component: HomePageComponent
  },
  {
    path: 'tableDetail',
    component: TableDetailComponent
  },
  {
    path: '',
    redirectTo: 'homePage',
    pathMatch: 'full'
  }
  // {
  //   path: 'alerts/alert/:AlertId',
  //   loadComponent: () => import('../tab3/alert-detail/alert-detail.page').then( m => m.AlertDetailPage),
  //   canActivate: [isLoggedInGuard]
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
