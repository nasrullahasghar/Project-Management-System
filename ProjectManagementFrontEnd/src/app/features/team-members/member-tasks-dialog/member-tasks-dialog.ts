import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TaskDto } from '../../tasks/services/task';

export interface MemberTasksDialogData {
  memberName: string;
  tasks: TaskDto[];
}

@Component({
  selector: 'app-member-tasks-dialog',
  imports: [MatDialogModule, MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './member-tasks-dialog.html',
  styleUrl: './member-tasks-dialog.scss',
})
export class MemberTasksDialog {
  private dialogRef = inject(MatDialogRef<MemberTasksDialog>);
  data = inject<MemberTasksDialogData>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}