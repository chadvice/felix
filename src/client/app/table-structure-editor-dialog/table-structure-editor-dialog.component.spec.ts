import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableStructureEditorDialogComponent } from './table-structure-editor-dialog.component';

describe('TableStructureEditorDialogComponent', () => {
  let component: TableStructureEditorDialogComponent;
  let fixture: ComponentFixture<TableStructureEditorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableStructureEditorDialogComponent]
    });
    fixture = TestBed.createComponent(TableStructureEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
