import { TestBed } from '@angular/core/testing';

import { Faq } from './faq';

describe('Faq', () => {
  let service: Faq;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Faq);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
