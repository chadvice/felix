import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportDataDialogComponent } from './import-data-dialog.component';

describe('ImportDataDialogComponent', () => {
  let component: ImportDataDialogComponent;
  let fixture: ComponentFixture<ImportDataDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImportDataDialogComponent]
    });
    fixture = TestBed.createComponent(ImportDataDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
