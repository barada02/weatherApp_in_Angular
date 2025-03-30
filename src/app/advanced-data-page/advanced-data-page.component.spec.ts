import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedDataPageComponent } from './advanced-data-page.component';

describe('AdvancedDataPageComponent', () => {
  let component: AdvancedDataPageComponent;
  let fixture: ComponentFixture<AdvancedDataPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedDataPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedDataPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
