import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface TaskDto {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  projectId: number;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  assignedToUserId: number | null;
}

export interface UpdateTaskDto {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToUserId: number | null;
}

const API_BASE = 'http://localhost:5020/api/projects';

@Injectable({
  providedIn: 'root',
})
export class Task {
  private http = inject(HttpClient);

  private tasksSignal = signal<TaskDto[]>([]);
  readonly tasks = this.tasksSignal.asReadonly();

  loadTasks(projectId: number): void {
    this.http.get<TaskDto[]>(`${API_BASE}/${projectId}/tasks`).subscribe({
      next: (data) => this.tasksSignal.set(data),
    });
  }

  getTask(projectId: number, id: number): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${API_BASE}/${projectId}/tasks/${id}`);
  }

  createTask(projectId: number, dto: CreateTaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(`${API_BASE}/${projectId}/tasks`, dto).pipe(
      tap((created) => this.tasksSignal.update((list) => [...list, created]))
    );
  }

  updateTask(projectId: number, id: number, dto: UpdateTaskDto): Observable<void> {
    return this.http.put<void>(`${API_BASE}/${projectId}/tasks/${id}`, dto).pipe(
      tap(() => this.loadTasks(projectId))
    );
  }

  deleteTask(projectId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/${projectId}/tasks/${id}`).pipe(
      tap(() => this.tasksSignal.update((list) => list.filter((t) => t.id !== id)))
    );
  }
}