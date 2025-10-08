import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrapAsset } from './scrap-asset';

describe('ScrapAsset', () => {
  let component: ScrapAsset;
  let fixture: ComponentFixture<ScrapAsset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrapAsset]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrapAsset);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
