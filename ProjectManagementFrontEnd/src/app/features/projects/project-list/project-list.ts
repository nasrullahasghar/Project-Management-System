import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Project } from '../services/project';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList implements OnInit {
  projectService = inject(Project);
  auth = inject(Auth);

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
}