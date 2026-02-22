import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataDialog } from './data-dialog';

describe('DataDialog', () => {
  let component: DataDialog;
  let fixture: ComponentFixture<DataDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
