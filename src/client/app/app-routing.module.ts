import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { TableDetailComponent } from './table-detail/table-detail.component';
import { UsersPageComponent } from './users-page/users-page.component';
import { RolesPageComponent } from './roles-page/roles-page.component';

const routes: Routes = [
  {
    path: 'homePage',
    component: HomePageComponent
  },
  {
    path: 'usersPage',
    component: UsersPageComponent
  },
  {
    path: 'rolesPage',
    component: RolesPageComponent
  },
  {
    path: 'tableDetail/:dataTableName',
    component: TableDetailComponent
  },
  {
    path: '',
    redirectTo: 'homePage',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
