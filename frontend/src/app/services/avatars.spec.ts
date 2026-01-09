import { TestBed } from '@angular/core/testing';

import { Avatars } from './avatars';

describe('Avatars', () => {
  let service: Avatars;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Avatars);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
