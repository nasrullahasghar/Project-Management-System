import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ProjectDescriptionDialogData {
  name: string;
  description: string;
}

@Component({
  selector: 'app-project-description-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './project-description-dialog.html',
  styleUrl: './project-description-dialog.scss',
})
export class ProjectDescriptionDialog {
  private dialogRef = inject(MatDialogRef<ProjectDescriptionDialog>);
  data = inject<ProjectDescriptionDialogData>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}