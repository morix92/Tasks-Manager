import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReminder } from './add-reminder';

describe('AddReminder', () => {
  let component: AddReminder;
  let fixture: ComponentFixture<AddReminder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddReminder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddReminder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
