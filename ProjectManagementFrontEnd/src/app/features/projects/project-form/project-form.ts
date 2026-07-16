import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Project } from '../services/project';

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss',
})
export class ProjectForm implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(Project);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  projectId: number | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;

  statusOptions = ['Planning', 'InProgress', 'Completed', 'OnHold'];

  projectForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    status: ['Planning', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.projectId = Number(idParam);

      this.projectService.getProject(this.projectId).subscribe({
        next: (project) => {
          this.projectForm.patchValue({
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate.substring(0, 10),
            endDate: project.endDate.substring(0, 10),
          });
        },
        error: () => {
          this.errorMessage = 'Could not load project.';
        },
      });
    }
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    const formValue = this.projectForm.getRawValue() as {
      name: string;
      description: string;
      status: string;
      startDate: string;
      endDate: string;
    };

    const onError = (err: { error?: { message?: string } | string }) => {
      this.isSubmitting = false;
      this.errorMessage =
        (typeof err.error === 'string' ? err.error : err.error?.message) ||
        'Something went wrong. Please try again.';
    };

    if (this.isEditMode) {
      this.projectService.updateProject(this.projectId!, formValue).subscribe({
        next: () => this.router.navigateByUrl('/projects'),
        error: onError,
      });
    } else {
      this.projectService.createProject(formValue).subscribe({
        next: () => this.router.navigateByUrl('/projects'),
        error: onError,
      });
    }
  }
}