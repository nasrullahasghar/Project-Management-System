import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import Chart from 'chart.js/auto';
import { Reports, ProjectProgressDto } from '../services/reports';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-project-progress',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './project-progress.html',
  styleUrl: './project-progress.scss',
})
export class ProjectProgress implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private reportsService = inject(Reports);

  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('exportTarget', { read: ElementRef }) exportTarget!: ElementRef<HTMLElement>;

  data = signal<ProjectProgressDto | null>(null);
  private chart: Chart | null = null;
  projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));
  }

  ngAfterViewInit(): void {
    this.reportsService.getProjectProgress(this.projectId).subscribe({
      next: (result) => {
        this.data.set(result);
        this.renderChart();
      },
      error: (err) => {
        console.error('Request failed:', err);
      },
    });
  }

  private renderChart(): void {
    const currentData = this.data();
    if (!currentData) {
      return;
    }
    this.chart = new Chart(this.donutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: currentData.statusBreakdown.map((s) => s.status),
        datasets: [
          {
            data: currentData.statusBreakdown.map((s) => s.count),
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