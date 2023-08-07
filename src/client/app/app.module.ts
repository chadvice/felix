import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MaterialModule } from './material.module';
import { TableDetailComponent } from './table-detail/table-detail.component';
import { HomePageComponent } from './home-page/home-page.component';
import { UsersPageComponent } from './users-page/users-page.component';
import { RolesPageComponent } from './roles-page/roles-page.component';
import { SessionExpiredDialogComponent } from './session-expired-dialog/session-expired-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    TableDetailComponent,
    HomePageComponent,
    UsersPageComponent,
    RolesPageComponent,
    SessionExpiredDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    DragDropModule
  ],
  providers: [ provideHttpClient()],
  bootstrap: [AppComponent]
})
export class AppModule { }
