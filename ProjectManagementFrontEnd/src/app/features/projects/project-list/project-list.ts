import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Project, ProjectDto } from '../services/project';
import { Auth } from '../../../core/services/auth';
import { ProjectDescriptionDialog } from '../project-description-dialog/project-description-dialog';

@Component({
  selector: 'app-project-list',
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
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList implements OnInit {
  projectService = inject(Project);
  auth = inject(Auth);
  private dialog = inject(MatDialog);

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
      data: { name: project.name, description: project.description },
      width: '500px',
    });
  }
}