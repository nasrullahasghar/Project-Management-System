import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import Chart from 'chart.js/auto';
import { Reports, TaskCompletionDto } from '../services/reports';
import { Project } from '../../projects/services/project';

@Component({
  selector: 'app-task-completion',
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
  ],
  templateUrl: './task-completion.html',
  styleUrl: './task-completion.scss',
})
export class TaskCompletion implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private reportsService = inject(Reports);
  projectService = inject(Project);

  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;

  data = signal<TaskCompletionDto | null>(null);
  selectedProjectId: number | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // Set when reached from a project's reports hub, via ?projectId= query param.
  // Used to pre-select the project and to build the correct "Back" link.
  sourceProjectId = signal<number | null>(null);

  private chart: Chart | null = null;

  ngOnInit(): void {
    this.projectService.loadProjects();

    const queryId = this.route.snapshot.queryParamMap.get('projectId');
    if (queryId) {
      const id = Number(queryId);
      this.sourceProjectId.set(id);
      this.selectedProjectId = id;
    }
  }

  ngAfterViewInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    const from = this.fromDate ? this.toDateOnlyString(this.fromDate) : undefined;
    const to = this.toDate ? this.toDateOnlyString(this.toDate) : undefined;
    const projectId = this.selectedProjectId ?? undefined;

    this.reportsService.getTaskCompletion(projectId, from, to).subscribe({
      next: (result) => {
        this.data.set(result);
        this.renderChart();
      },
      error: (err) => {
        console.error('Failed to load task completion report:', err);
      },
    });
  }

  exportCsv(): void {
    const currentData = this.data();
    if (!currentData) {
      return;
    }

    const rows = [['Date', 'Completed Count']];
    for (const point of currentData.dataPoints) {
      rows.push([point.date, point.completedCount.toString()]);
    }

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `task-completion-${currentData.from}-to-${currentData.to}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private toDateOnlyString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private renderChart(): void {
    const currentData = this.data();
    if (!currentData) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: currentData.dataPoints.map((p) => p.date),
        datasets: [
          {
            label: 'Tasks Completed',
            data: currentData.dataPoints.map((p) => p.completedCount),
            borderColor: '#30D4C7',
            backgroundColor: 'rgba(48, 212, 199, 0.15)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
}