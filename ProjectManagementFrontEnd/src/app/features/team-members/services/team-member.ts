import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface TeamMemberDto {
  id: number;
  roleInProject: string;
  joinedAt: string;
  projectId: number;
  userId: number;
  userFullName: string;
  userEmail: string;
}

export interface AddTeamMemberDto {
  userId: number;
  roleInProject: string;
}

export interface UpdateTeamMemberDto {
  roleInProject: string;
}

const API_BASE = 'http://localhost:8000/api/projects';

@Injectable({
  providedIn: 'root',
})
export class TeamMember {
  private http = inject(HttpClient);

  private membersSignal = signal<TeamMemberDto[]>([]);
  readonly members = this.membersSignal.asReadonly();

  loadTeamMembers(projectId: number): void {
    this.http.get<TeamMemberDto[]>(`${API_BASE}/${projectId}/teammembers`).subscribe({
      next: (data) => this.membersSignal.set(data),
    });
  }

  getTeamMembers(projectId: number): Observable<TeamMemberDto[]> {
    return this.http.get<TeamMemberDto[]>(`${API_BASE}/${projectId}/teammembers`);
  }

  addTeamMember(projectId: number, dto: AddTeamMemberDto): Observable<TeamMemberDto> {
    return this.http.post<TeamMemberDto>(`${API_BASE}/${projectId}/teammembers`, dto).pipe(
      tap((created) => this.membersSignal.update((list) => [...list, created]))
    );
  }

  updateTeamMember(projectId: number, id: number, dto: UpdateTeamMemberDto): Observable<void> {
    return this.http.put<void>(`${API_BASE}/${projectId}/teammembers/${id}`, dto).pipe(
      tap(() => this.loadTeamMembers(projectId))
    );
  }

  removeTeamMember(projectId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/${projectId}/teammembers/${id}`).pipe(
      tap(() => this.membersSignal.update((list) => list.filter((m) => m.id !== id)))
    );
  }
}