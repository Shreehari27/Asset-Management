import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetModification } from './asset-modification';

describe('AssetModification', () => {
  let component: AssetModification;
  let fixture: ComponentFixture<AssetModification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetModification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetModification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
