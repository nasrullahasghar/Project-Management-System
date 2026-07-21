import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TeamMember, TeamMemberDto } from '../services/team-member';
import { User, UserDto } from '../../users/services/user';
import { Auth } from '../../../core/services/auth';
import { Task } from '../../tasks/services/task';
import { MemberTasksDialog } from '../member-tasks-dialog/member-tasks-dialog';

@Component({
  selector: 'app-team-member-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './team-member-list.html',
  styleUrl: './team-member-list.scss',
})
export class TeamMemberList implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(User);
  teamMemberService = inject(TeamMember);
  taskService = inject(Task);
  auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

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
    this.taskService.loadTasks(this.projectId);
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

  viewAssignedTasks(member: TeamMemberDto): void {
    const assignedTasks = this.taskService.tasks().filter((t) => t.assignedToUserId === member.userId);

    this.dialog.open(MemberTasksDialog, {
      data: { memberName: member.userFullName, tasks: assignedTasks },
      width: '500px',
    });
  }
}