import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionExpiredDialogComponent } from './session-expired-dialog.component';

describe('SessionExpiredDialogComponent', () => {
  let component: SessionExpiredDialogComponent;
  let fixture: ComponentFixture<SessionExpiredDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SessionExpiredDialogComponent]
    });
    fixture = TestBed.createComponent(SessionExpiredDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
