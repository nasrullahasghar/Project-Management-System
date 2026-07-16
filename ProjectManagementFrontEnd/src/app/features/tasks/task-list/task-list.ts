import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Task } from '../services/task';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-task-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  taskService = inject(Task);
  auth = inject(Auth);
  private route = inject(ActivatedRoute);

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
}