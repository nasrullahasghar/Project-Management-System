import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Task, TaskDto } from '../services/task';
import { Auth } from '../../../core/services/auth';
import { ProjectDescriptionDialog } from '../../projects/project-description-dialog/project-description-dialog';

@Component({
  selector: 'app-task-list',
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  taskService = inject(Task);
  auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  projectId!: number;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    this.taskService.loadTasks(this.projectId);
  }

  get canManage(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'ProjectManager';
  }

  onDelete(id: number, title: string): void {
    if (!confirm(`Delete task "${title}"? This cannot be undone.`)) {
      return;
    }
    this.taskService.deleteTask(this.projectId, id).subscribe();
  }

  viewDescription(task: TaskDto): void {
    this.dialog.open(ProjectDescriptionDialog, {
      data: { name: task.title, description: task.description },
      width: '500px',
    });
  }
}