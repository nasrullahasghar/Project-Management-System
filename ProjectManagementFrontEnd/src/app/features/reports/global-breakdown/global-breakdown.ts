import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Chart from 'chart.js/auto';
import { Reports, GlobalBreakdownDto } from '../services/reports';

@Component({
  selector: 'app-global-breakdown',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './global-breakdown.html',
  styleUrl: './global-breakdown.scss',
})
export class GlobalBreakdown implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private reportsService = inject(Reports);

  @ViewChild('statusCanvas') statusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityCanvas') priorityCanvas!: ElementRef<HTMLCanvasElement>;

  data = signal<GlobalBreakdownDto | null>(null);
  sourceProjectId = signal<number | null>(null);

  private statusChart: Chart | null = null;
  private priorityChart: Chart | null = null;

  ngOnInit(): void {
    const queryId = this.route.snapshot.queryParamMap.get('projectId');
    if (queryId) {
      this.sourceProjectId.set(Number(queryId));
    }
  }

  ngAfterViewInit(): void {
    this.reportsService.getGlobalBreakdown().subscribe({
      next: (result) => {
        this.data.set(result);
        this.renderCharts();
      },
      error: (err) => {
        console.error('Failed to load global breakdown report:', err);
      },
    });
  }

  private renderCharts(): void {
    const currentData = this.data();
    if (!currentData) {
      return;
    }

    this.statusChart = new Chart(this.statusCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: currentData.byStatus.map((s) => s.status),
        datasets: [
          {
            data: currentData.byStatus.map((s) => s.count),
            backgroundColor: ['#30D4C7', '#185D92', '#FBAE25', '#052D46'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });

    this.priorityChart = new Chart(this.priorityCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: currentData.byPriority.map((p) => p.priority),
        datasets: [
          {
            data: currentData.byPriority.map((p) => p.count),
            backgroundColor: ['#FBAE25', '#30D4C7', '#185D92', '#052D46'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }
}