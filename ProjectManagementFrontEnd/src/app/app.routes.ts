import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/projects/project-list/project-list').then((m) => m.ProjectList),
  },
  {
    path: 'projects/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'ProjectManager'] },
    loadComponent: () =>
      import('./features/projects/project-form/project-form').then((m) => m.ProjectForm),
  },
  {
    path: 'projects/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'ProjectManager'] },
    loadComponent: () =>
      import('./features/projects/project-form/project-form').then((m) => m.ProjectForm),
  },
  {
    path: 'projects/:projectId/tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/task-list/task-list').then((m) => m.TaskList),
  },
  {
    path: 'projects/:projectId/tasks/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'ProjectManager'] },
    loadComponent: () =>
      import('./features/tasks/task-form/task-form').then((m) => m.TaskForm),
  },
  {
    path: 'projects/:projectId/tasks/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'ProjectManager'] },
    loadComponent: () =>
      import('./features/tasks/task-form/task-form').then((m) => m.TaskForm),
  },
  {
    path: 'projects/:projectId/team',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/team-members/team-member-list/team-member-list').then((m) => m.TeamMemberList),
  },
  {
    path: 'projects/:projectId/reports/progress',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/project-progress/project-progress').then(
        (m) => m.ProjectProgress
      ),
  },
{
    path: 'reports/task-completion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/task-completion/task-completion').then(
        (m) => m.TaskCompletion
      ),
  },
  {
    path: 'projects/:projectId/reports/team-performance',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/team-performance/team-performance').then(
        (m) => m.TeamPerformance
      ),
  },
  {
    path: 'reports/global-breakdown',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/global-breakdown/global-breakdown').then(
        (m) => m.GlobalBreakdown
      ),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/reports-home/reports-home').then(
        (m) => m.ReportsHome
      ),
  },
  {
    path: 'projects/:projectId/reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/reports-home/reports-home').then(
        (m) => m.ReportsHome
      ),
  },
];