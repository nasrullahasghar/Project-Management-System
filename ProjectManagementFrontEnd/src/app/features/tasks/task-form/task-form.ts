import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Task } from '../services/task';
import { TeamMember, TeamMemberDto } from '../../team-members/services/team-member';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(Task);
  private teamMemberService = inject(TeamMember);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  projectId!: number;
  isEditMode = false;
  taskId: number | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;

  teamMembers: TeamMemberDto[] = [];

  statusOptions = ['ToDo', 'InProgress', 'Done'];
  priorityOptions = ['Low', 'Medium', 'High'];

  taskForm = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    status: ['ToDo', [Validators.required]],
    priority: ['Medium', [Validators.required]],
    dueDate: [''],
    assignedToUserId: [''],
  });

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));

    this.teamMemberService.getTeamMembers(this.projectId).subscribe({
      next: (members) => (this.teamMembers = members),
    });

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.taskId = Number(idParam);

      this.taskService.getTask(this.projectId, this.taskId).subscribe({
        next: (task) => {
          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
            assignedToUserId: task.assignedToUserId ? String(task.assignedToUserId) : '',
          });
        },
        error: () => {
          this.errorMessage = 'Could not load task.';
        },
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const raw = this.taskForm.getRawValue();
    const assignedToUserId = raw.assignedToUserId ? Number(raw.assignedToUserId) : null;
    const dueDate = raw.dueDate ? raw.dueDate : null;

    const onError = (err: { error?: { message?: string } | string }) => {
      this.isSubmitting = false;
      this.errorMessage =
        (typeof err.error === 'string' ? err.error : err.error?.message) ||
        'Something went wrong. Please try again.';
    };

    if (this.isEditMode) {
      const dto = {
        title: raw.title!,
        description: raw.description!,
        status: raw.status!,
        priority: raw.priority!,
        dueDate,
        assignedToUserId,
      };
      this.taskService.updateTask(this.projectId, this.taskId!, dto).subscribe({
        next: () => this.router.navigate(['/projects', this.projectId, 'tasks']),
        error: onError,
      });
    } else {
      const dto = {
        title: raw.title!,
        description: raw.description!,
        priority: raw.priority!,
        dueDate,
        assignedToUserId,
      };
      this.taskService.createTask(this.projectId, dto).subscribe({
        next: () => this.router.navigate(['/projects', this.projectId, 'tasks']),
        error: onError,
      });
    }
  }
}