import { TestBed } from '@angular/core/testing';

import { RemindersApi } from './reminders-api';

describe('RemindersApi', () => {
  let service: RemindersApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemindersApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
