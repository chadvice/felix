import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MigrationsPageComponent } from './migrations-page.component';

describe('MigrationsPageComponent', () => {
  let component: MigrationsPageComponent;
  let fixture: ComponentFixture<MigrationsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MigrationsPageComponent]
    });
    fixture = TestBed.createComponent(MigrationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
