import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Auth } from '../../../core/services/auth';
import { Project, ProjectDto } from '../services/project';
import { ProjectDescriptionDialog } from '../project-description-dialog/project-description-dialog';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList implements OnInit {
  projectService = inject(Project);
  auth = inject(Auth);
  private dialog = inject(MatDialog);

  // Search input
  searchTerm = signal('');

  // Filtered projects
  filteredProjects = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const projects = this.projectService.projects();

    if (!term) {
      return projects;
    }

    return projects.filter(project =>
      project.name.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.projectService.loadProjects();
  }

  get canManage(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'ProjectManager';
  }

  onDelete(id: number, name: string): void {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) {
      return;
    }

    this.projectService.deleteProject(id).subscribe();
  }

  viewDescription(project: ProjectDto): void {
    this.dialog.open(ProjectDescriptionDialog, {
      width: '500px',
      data: {
        name: project.name,
        description: project.description,
      },
    });
  }
}