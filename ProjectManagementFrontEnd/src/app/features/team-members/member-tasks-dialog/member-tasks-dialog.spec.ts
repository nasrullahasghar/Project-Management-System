import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberTasksDialog } from './member-tasks-dialog';

describe('MemberTasksDialog', () => {
  let component: MemberTasksDialog;
  let fixture: ComponentFixture<MemberTasksDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberTasksDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberTasksDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
