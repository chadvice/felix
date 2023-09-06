import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTableEditorDialogComponent } from './new-table-editor-dialog.component';

describe('NewTableEditorDialogComponent', () => {
  let component: NewTableEditorDialogComponent;
  let fixture: ComponentFixture<NewTableEditorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewTableEditorDialogComponent]
    });
    fixture = TestBed.createComponent(NewTableEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
