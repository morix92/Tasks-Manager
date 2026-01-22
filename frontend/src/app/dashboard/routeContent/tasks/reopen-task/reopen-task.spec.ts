import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReopenTask } from './reopen-task';

describe('ReopenTask', () => {
  let component: ReopenTask;
  let fixture: ComponentFixture<ReopenTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReopenTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReopenTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
