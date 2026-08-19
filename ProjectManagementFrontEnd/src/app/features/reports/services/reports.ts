import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface ProjectProgressDto {
  projectId: number;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
  statusBreakdown: StatusBreakdownItem[];
}

export interface TaskCompletionDataPoint {
  date: string;
  completedCount: number;
}

export interface TaskCompletionDto {
  from: string;
  to: string;
  dataPoints: TaskCompletionDataPoint[];
}

export interface TeamPerformanceMember {
  userId: number;
  userName: string;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
}

export interface TeamPerformanceDto {
  projectId: number;
  members: TeamPerformanceMember[];
}

export interface PriorityBreakdownItem {
  priority: string;
  count: number;
}

export interface GlobalBreakdownDto {
  byStatus: StatusBreakdownItem[];
  byPriority: PriorityBreakdownItem[];
}

const API_BASE = 'http://localhost:8000/api/reports';

@Injectable({
  providedIn: 'root',
})
export class Reports {
  private http = inject(HttpClient);

  getProjectProgress(projectId: number): Observable<ProjectProgressDto> {
    return this.http.get<ProjectProgressDto>(
      `${API_BASE}/projects/${projectId}/progress`
    );
  }

  getTaskCompletion(
    projectId?: number,
    from?: string,
    to?: string
  ): Observable<TaskCompletionDto> {
    let params = new HttpParams();
    if (projectId !== undefined) {
      params = params.set('projectId', projectId);
    }
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    return this.http.get<TaskCompletionDto>(`${API_BASE}/task-completion`, {
      params,
    });
  }

  getTeamPerformance(projectId: number): Observable<TeamPerformanceDto> {
    return this.http.get<TeamPerformanceDto>(
      `${API_BASE}/projects/${projectId}/team-performance`
    );
  }

  getGlobalBreakdown(): Observable<GlobalBreakdownDto> {
    return this.http.get<GlobalBreakdownDto>(`${API_BASE}/global-breakdown`);
  }
}