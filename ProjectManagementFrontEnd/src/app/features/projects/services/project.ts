import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface ProjectDto {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  createdByUserId: number;
  createdByUserName: string;
  taskCount: number;
  teamMemberCount: number;
}

export interface CreateProjectDto {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface UpdateProjectDto {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

const API_BASE = 'http://localhost:5020/api/projects';

@Injectable({
  providedIn: 'root',
})
export class Project {
  private http = inject(HttpClient);

  // Shared list, owned by the service. Components read this instead of
  // each fetching and holding their own separate copy.
  private projectsSignal = signal<ProjectDto[]>([]);
  readonly projects = this.projectsSignal.asReadonly();

  loadProjects(): void {
    this.http.get<ProjectDto[]>(API_BASE).subscribe({
      next: (data) => this.projectsSignal.set(data),
    });
  }

  getProject(id: number): Observable<ProjectDto> {
    return this.http.get<ProjectDto>(`${API_BASE}/${id}`);
  }

  createProject(dto: CreateProjectDto): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(API_BASE, dto).pipe(
      tap((created) => this.projectsSignal.update((list) => [...list, created]))
    );
  }

  updateProject(id: number, dto: UpdateProjectDto): Observable<void> {
    return this.http.put<void>(`${API_BASE}/${id}`, dto).pipe(
      tap(() => this.loadProjects())
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/${id}`).pipe(
      tap(() => this.projectsSignal.update((list) => list.filter((p) => p.id !== id)))
    );
  }
}