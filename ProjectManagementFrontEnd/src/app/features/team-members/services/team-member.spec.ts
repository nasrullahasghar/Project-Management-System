import { TestBed } from '@angular/core/testing';

import { TeamMember } from './team-member';

describe('TeamMember', () => {
  let service: TeamMember;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamMember);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
