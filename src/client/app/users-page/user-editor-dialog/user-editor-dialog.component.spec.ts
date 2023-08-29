import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEditorDialogComponent } from './user-editor-dialog.component';

describe('UserEditorDialogComponent', () => {
  let component: UserEditorDialogComponent;
  let fixture: ComponentFixture<UserEditorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserEditorDialogComponent]
    });
    fixture = TestBed.createComponent(UserEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
