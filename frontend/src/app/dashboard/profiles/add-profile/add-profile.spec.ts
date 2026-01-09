import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProfile } from './add-profile';

describe('AddProfile', () => {
  let component: AddProfile;
  let fixture: ComponentFixture<AddProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
