import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditReminder } from './edit-reminder';

describe('EditReminder', () => {
  let component: EditReminder;
  let fixture: ComponentFixture<EditReminder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReminder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditReminder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
