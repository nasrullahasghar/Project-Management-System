import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Chart from 'chart.js/auto';
import { Reports, TeamPerformanceDto } from '../services/reports';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-team-performance',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './team-performance.html',
  styleUrl: './team-performance.scss',
})
export class TeamPerformance implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private reportsService = inject(Reports);

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('exportTarget', { read: ElementRef }) exportTarget!: ElementRef<HTMLElement>;

  data = signal<TeamPerformanceDto | null>(null);
  private chart: Chart | null = null;
  projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
  }

  ngAfterViewInit(): void {
    this.reportsService.getTeamPerformance(this.projectId).subscribe({
      next: (result) => {
        this.data.set(result);
        this.renderChart();
      },
      error: (err) => {
        console.error('Failed to load team performance report:', err);
      },
    });
  }

  private renderChart(): void {
    const currentData = this.data();
    if (!currentData) {
      return;
    }

    const labels = currentData.members.map((m) => m.userName);

    this.chart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Assigned',
            data: currentData.members.map((m) => m.assignedCount),
            backgroundColor: '#185D92',
          },
          {
            label: 'Completed',
            data: currentData.members.map((m) => m.completedCount),
            backgroundColor: '#30D4C7',
          },
          {
            label: 'Overdue',
            data: currentData.members.map((m) => m.overdueCount),
            backgroundColor: '#FBAE25',
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  async exportPdf(): Promise<void> {
    const element = this.exportTarget.nativeElement;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale the image to fit the page width, preserving aspect ratio
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // If the content is taller than one page, add extra pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`project-progress-${this.projectId}.pdf`); // change filename per file
  }
}