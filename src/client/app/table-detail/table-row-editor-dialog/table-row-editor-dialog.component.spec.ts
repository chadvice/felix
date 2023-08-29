import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableRowEditorDialogComponent } from './table-row-editor-dialog.component';

describe('TableRowEditorDialogComponent', () => {
  let component: TableRowEditorDialogComponent;
  let fixture: ComponentFixture<TableRowEditorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableRowEditorDialogComponent]
    });
    fixture = TestBed.createComponent(TableRowEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
