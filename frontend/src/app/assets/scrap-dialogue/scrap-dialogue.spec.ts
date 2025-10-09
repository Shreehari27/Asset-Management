import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrapDialogue } from './scrap-dialogue';

describe('ScrapDialogue', () => {
  let component: ScrapDialogue;
  let fixture: ComponentFixture<ScrapDialogue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrapDialogue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrapDialogue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
