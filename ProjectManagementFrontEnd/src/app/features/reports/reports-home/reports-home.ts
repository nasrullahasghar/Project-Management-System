import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Project } from '../../projects/services/project';

@Component({
  selector: 'app-reports-home',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './reports-home.html',
  styleUrl: './reports-home.scss',
})
export class ReportsHome implements OnInit {
  projectService = inject(Project);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Set only when this page is reached via /projects/:projectId/reports.
  // When present, the project is already known, so we skip the dropdowns.
  routeProjectId = signal<number | null>(null);

  selectedProjectId = signal<number | null>(null);

  ngOnInit(): void {
    this.projectService.loadProjects();

    const paramId = this.route.snapshot.paramMap.get('projectId');
    if (paramId) {
      const id = Number(paramId);
      this.routeProjectId.set(id);
      this.selectedProjectId.set(id);
    }
  }

  get routeProjectName(): string {
    const id = this.routeProjectId();
    const project = this.projectService.projects().find((p) => p.id === id);
    return project ? project.name : '';
  }

  goToProgress(): void {
    const id = this.selectedProjectId();
    if (id) {
      this.router.navigate(['/projects', id, 'reports', 'progress']);
    }
  }

  goToTeamPerformance(): void {
    const id = this.selectedProjectId();
    if (id) {
      this.router.navigate(['/projects', id, 'reports', 'team-performance']);
    }
  }
}