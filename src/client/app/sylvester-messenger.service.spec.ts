import { TestBed } from '@angular/core/testing';

import { SylvesterMessengerService } from './sylvester-messenger.service';

describe('SylvesterMessengerService', () => {
  let service: SylvesterMessengerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SylvesterMessengerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
