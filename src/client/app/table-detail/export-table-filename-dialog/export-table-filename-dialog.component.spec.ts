import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportTableFilenameDialogComponent } from './export-table-filename-dialog.component';

describe('ExportTableFilenameDialogComponent', () => {
  let component: ExportTableFilenameDialogComponent;
  let fixture: ComponentFixture<ExportTableFilenameDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExportTableFilenameDialogComponent]
    });
    fixture = TestBed.createComponent(ExportTableFilenameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
