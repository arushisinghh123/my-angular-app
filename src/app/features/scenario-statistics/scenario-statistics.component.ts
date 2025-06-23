import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil, forkJoin } from 'rxjs';
import { ScenarioService, Scenario } from '../../core/services/scenario.service';
import { SequenceService, Sequence } from '../../core/services/sequence.service';

interface ScenarioStatistic {
  scenario: string;
  sequenceCount: number;
  percentage: number;
  color: string;
  frameFraction: string;
  totalFrames: number;
  scenarioFrames: number;
}

@Component({
  selector: 'app-scenario-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './scenario-statistics.component.html',
  styleUrls: ['./scenario-statistics.component.scss']
})
export class ScenarioStatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  statisticsData: ScenarioStatistic[] = [];
  isLoading = true;
  totalSequences = 0;

  private destroy$ = new Subject<void>();
  private chart: any = null;

  // Enhanced color palette for better dark mode support
  private colors = [
    '#bb86fc', // Purple
    '#03dac6', // Teal
    '#cf6679', // Pink
    '#ffd54f', // Amber
    '#81c784', // Green
    '#64b5f6', // Blue
    '#ffb74d', // Orange
    '#f06292', // Pink
    '#9575cd', // Deep Purple
    '#4db6ac', // Teal
    '#a5d6a7', // Light Green
    '#ffcc02', // Yellow
    '#ff8a65'  // Deep Orange
  ];

  constructor(
    private scenarioService: ScenarioService,
    private sequenceService: SequenceService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private loadStatistics(): void {
    this.isLoading = true;

    forkJoin({
      scenarios: this.scenarioService.getScenarios(),
      sequences: this.sequenceService.getAllSequences()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ scenarios, sequences }) => {
        this.totalSequences = sequences.length;
        this.calculateStatistics(scenarios, sequences);
        this.isLoading = false;
        
        // Create chart after view init
        setTimeout(() => this.createChart(), 100);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateStatistics(scenarios: Scenario[], sequences: Sequence[]): void {
    this.statisticsData = scenarios.map((scenario, index) => {
      const sequencesWithScenario = sequences.filter(seq =>
        seq.scenarios.some(s => s.scenarioId === scenario.id)
      );

      // Calculate frame fractions
      let totalFrames = 0;
      let scenarioFrames = 0;

      sequences.forEach(seq => {
        const seqTotalFrames = seq.totalFrames || 1000;
        totalFrames += seqTotalFrames;
        
        const scenarioData = seq.scenarios.find(s => s.scenarioId === scenario.id);
        if (scenarioData) {
          scenarioFrames += Math.floor((seqTotalFrames * scenarioData.percentage) / 100);
        }
      });

      const frameFraction = totalFrames > 0 ? 
        `${scenarioFrames}/${totalFrames}` : 
        '0/0';

      return {
        scenario: scenario.name,
        sequenceCount: sequencesWithScenario.length,
        percentage: Math.round((sequencesWithScenario.length / sequences.length) * 100),
        color: this.colors[index % this.colors.length],
        frameFraction,
        totalFrames,
        scenarioFrames
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  private createChart(): void {
    if (!this.chartCanvas?.nativeElement) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    this.drawDoughnutChart(ctx, canvas.width, canvas.height);
  }

  private drawDoughnutChart(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 20;
    const innerRadius = outerRadius * 0.6;

    let currentAngle = -Math.PI / 2; // Start from top

    this.statisticsData.forEach((data) => {
      const sliceAngle = (data.percentage / 100) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = data.color;
      ctx.fill();

      // Add subtle border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }

  trackByScenario(index: number, item: ScenarioStatistic): string {
    return item.scenario;
  }
}