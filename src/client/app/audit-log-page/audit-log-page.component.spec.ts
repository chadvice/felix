import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogPageComponent } from './audit-log-page.component';

describe('AuditLogPageComponent', () => {
  let component: AuditLogPageComponent;
  let fixture: ComponentFixture<AuditLogPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditLogPageComponent]
    });
    fixture = TestBed.createComponent(AuditLogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
