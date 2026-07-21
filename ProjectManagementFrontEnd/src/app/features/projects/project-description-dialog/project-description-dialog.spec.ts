import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDescriptionDialog } from './project-description-dialog';

describe('ProjectDescriptionDialog', () => {
  let component: ProjectDescriptionDialog;
  let fixture: ComponentFixture<ProjectDescriptionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDescriptionDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDescriptionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
