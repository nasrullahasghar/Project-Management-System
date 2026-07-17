import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeamMember } from '../services/team-member';
import { User, UserDto } from '../../users/services/user';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-team-member-list',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './team-member-list.html',
  styleUrl: './team-member-list.scss',
})
export class TeamMemberList implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(User);
  teamMemberService = inject(TeamMember);
  auth = inject(Auth);
  private route = inject(ActivatedRoute);

  projectId!: number;
  availableUsers: UserDto[] = [];
  errorMessage: string | null = null;
  isSubmitting = false;

  addMemberForm = this.fb.group({
    userId: ['', [Validators.required]],
    roleInProject: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.teamMemberService.loadTeamMembers(this.projectId);
    this.loadAvailableUsers();
  }

  get canManage(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'ProjectManager';
  }

  private loadAvailableUsers(): void {
    this.userService.getUsers(this.projectId).subscribe({
      next: (users) => (this.availableUsers = users),
    });
  }

  onAddMember(): void {
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    const raw = this.addMemberForm.getRawValue();

    this.teamMemberService
      .addTeamMember(this.projectId, {
        userId: Number(raw.userId),
        roleInProject: raw.roleInProject!,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.addMemberForm.reset();
          this.loadAvailableUsers(); // refresh dropdown to exclude the newly-added user
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage =
            (typeof err.error === 'string' ? err.error : err.error?.message) ||
            'Could not add team member.';
        },
      });
  }

  onRemove(id: number, name: string): void {
    if (!confirm(`Remove "${name}" from this project?`)) {
      return;
    }
    this.teamMemberService.removeTeamMember(this.projectId, id).subscribe();
  }
}