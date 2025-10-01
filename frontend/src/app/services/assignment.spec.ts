import { TestBed } from '@angular/core/testing';

import { Assignment } from './assignment';

describe('Assignment', () => {
  let service: Assignment;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Assignment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
