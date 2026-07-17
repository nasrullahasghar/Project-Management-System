import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamMemberList } from './team-member-list';

describe('TeamMemberList', () => {
  let component: TeamMemberList;
  let fixture: ComponentFixture<TeamMemberList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamMemberList],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamMemberList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
