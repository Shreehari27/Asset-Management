import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnDialogue } from './return-dialogue';

describe('ReturnDialogue', () => {
  let component: ReturnDialogue;
  let fixture: ComponentFixture<ReturnDialogue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnDialogue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReturnDialogue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
