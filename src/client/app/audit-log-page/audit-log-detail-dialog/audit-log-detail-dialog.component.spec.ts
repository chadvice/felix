import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogDetailDialogComponent } from './audit-log-detail-dialog.component';

describe('AuditLogDetailDialogComponent', () => {
  let component: AuditLogDetailDialogComponent;
  let fixture: ComponentFixture<AuditLogDetailDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditLogDetailDialogComponent]
    });
    fixture = TestBed.createComponent(AuditLogDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
