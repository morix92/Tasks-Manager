import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemindersFromTask } from './reminders-from-task';

describe('RemindersFromTask', () => {
  let component: RemindersFromTask;
  let fixture: ComponentFixture<RemindersFromTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemindersFromTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemindersFromTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
