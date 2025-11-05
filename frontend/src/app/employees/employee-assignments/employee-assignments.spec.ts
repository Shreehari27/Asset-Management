import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAssignments } from './employee-assignments';

describe('EmployeeAssignments', () => {
  let component: EmployeeAssignments;
  let fixture: ComponentFixture<EmployeeAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeAssignments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
