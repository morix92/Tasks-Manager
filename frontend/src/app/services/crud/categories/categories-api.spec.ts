import { TestBed } from '@angular/core/testing';

import { CategoriesApi } from './categories-api';

describe('CategoriesApi', () => {
  let service: CategoriesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoriesApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
