import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MaterialModule } from './material.module';
import { TableDetailComponent } from './table-detail/table-detail.component';
import { HomePageComponent } from './home-page/home-page.component';
import { UsersPageComponent } from './users-page/users-page.component';
import { RolesPageComponent } from './roles-page/roles-page.component';
import { SessionExpiredDialogComponent } from './session-expired-dialog/session-expired-dialog.component';
import { HttpInterceptService } from './http-intercept.service';
import { TableRowEditorDialogComponent } from './table-detail/table-row-editor-dialog/table-row-editor-dialog.component';
import { TableStructureEditorDialogComponent } from './table-structure-editor-dialog/table-structure-editor-dialog.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { ImportDataDialogComponent } from './import-data-dialog/import-data-dialog.component';
import { ExportTableFilenameDialogComponent } from './table-detail/export-table-filename-dialog/export-table-filename-dialog.component';
import { UserEditorDialogComponent } from './users-page/user-editor-dialog/user-editor-dialog.component';
import { RoleEditorDialogComponent } from './roles-page/role-editor-dialog/role-editor-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    TableDetailComponent,
    HomePageComponent,
    UsersPageComponent,
    RolesPageComponent,
    SessionExpiredDialogComponent,
    TableRowEditorDialogComponent,
    TableStructureEditorDialogComponent,
    ConfirmationDialogComponent,
    ImportDataDialogComponent,
    ExportTableFilenameDialogComponent,
    UserEditorDialogComponent,
    RoleEditorDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
    DragDropModule
  ],
  providers: [ 
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptService, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
