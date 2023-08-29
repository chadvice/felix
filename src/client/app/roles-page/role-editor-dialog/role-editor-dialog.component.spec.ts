import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleEditorDialogComponent } from './role-editor-dialog.component';

describe('RoleEditorDialogComponent', () => {
  let component: RoleEditorDialogComponent;
  let fixture: ComponentFixture<RoleEditorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoleEditorDialogComponent]
    });
    fixture = TestBed.createComponent(RoleEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
