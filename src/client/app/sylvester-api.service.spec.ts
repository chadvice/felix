import { TestBed } from '@angular/core/testing';

import { SylvesterApiService } from './sylvester-api.service';

describe('SylvesterApiService', () => {
  let service: SylvesterApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SylvesterApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
