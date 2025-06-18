import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject } from 'rxjs';
import { takeUntil, forkJoin } from 'rxjs';
import { ScenarioService, Scenario } from '../../core/services/scenario.service';
import { SequenceService, Sequence } from '../../core/services/sequence.service';
import { ThemeService } from '../../core/services/theme.service';

interface ScenarioStatistic {
  name: string;
  frameCount: number;
  percentage: number;
  sequenceCount: number;
  color: string;
}

@Component({
  selector: 'app-scenario-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './scenario-statistics.component.html',
  styleUrls: ['./scenario-statistics.component.scss']
})
export class ScenarioStatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  scenarioStats: ScenarioStatistic[] = [];
  totalFrames = 0;
  totalSequences = 0;
  isLoading = true;
  isDarkMode = false;

  hoveredScenario: ScenarioStatistic | null = null;
  tooltipPosition = { x: 0, y: 0 };

  private chart: any;
  private destroy$ = new Subject<void>();

  // Enhanced color palette for better visual appeal
  private colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  constructor(
    private scenarioService: ScenarioService,
    private sequenceService: SequenceService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDarkMode();
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
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ scenarios, sequences }) => {
        this.calculateStatistics(scenarios, sequences);
        this.isLoading = false;
        setTimeout(() => this.createChart(), 100);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateStatistics(scenarios: Scenario[], sequences: Sequence[]): void {
    this.totalSequences = sequences.length;
    this.totalFrames = sequences.reduce((sum, seq) => sum + (seq.totalFrames || 1000), 0);

    const scenarioMap = new Map<string, ScenarioStatistic>();

    scenarios.forEach((scenario, index) => {
      let totalFramesForScenario = 0;
      let sequenceCount = 0;

      sequences.forEach(sequence => {
        const scenarioData = sequence.scenarios.find(s => s.scenarioId === scenario.id);
        if (scenarioData && scenarioData.percentage > 0) {
          const sequenceFrames = sequence.totalFrames || 1000;
          const scenarioFrames = Math.round((scenarioData.percentage / 100) * sequenceFrames);
          totalFramesForScenario += scenarioFrames;
          sequenceCount++;
        }
      });

      if (totalFramesForScenario > 0) {
        scenarioMap.set(scenario.id, {
          name: scenario.name,
          frameCount: totalFramesForScenario,
          percentage: (totalFramesForScenario / this.totalFrames) * 100,
          sequenceCount,
          color: this.colors[index % this.colors.length]
        });
      }
    });

    this.scenarioStats = Array.from(scenarioMap.values())
      .sort((a, b) => b.percentage - a.percentage);
  }

  private createChart(): void {
    if (!this.chartCanvas?.nativeElement) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Simple canvas-based doughnut chart
    this.drawDoughnutChart(ctx);
  }

  private drawDoughnutChart(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.6;

    let currentAngle = -Math.PI / 2; // Start from top

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.scenarioStats.forEach(stat => {
      const sliceAngle = (stat.percentage / 100) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = stat.color;
      ctx.fill();

      // Add subtle stroke
      ctx.strokeStyle = this.isDarkMode ? '#404040' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }

  onChartHover(event: MouseEvent): void {
    const rect = this.chartCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = this.chartCanvas.nativeElement.width / 2;
    const centerY = this.chartCanvas.nativeElement.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.6;

    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    if (distance >= innerRadius && distance <= outerRadius) {
      const angle = Math.atan2(y - centerY, x - centerX);
      const normalizedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);

      let currentAngle = 0;
      for (const stat of this.scenarioStats) {
        const sliceAngle = (stat.percentage / 100) * 2 * Math.PI;
        if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
          this.hoveredScenario = stat;
          this.tooltipPosition = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          return;
        }
        currentAngle += sliceAngle;
      }
    }

    this.hoveredScenario = null;
  }

  onChartLeave(): void {
    this.hoveredScenario = null;
  }

  highlightScenario(scenario: ScenarioStatistic): void {
    this.hoveredScenario = scenario;
  }

  clearHighlight(): void {
    this.hoveredScenario = null;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setDarkMode(this.isDarkMode);
    setTimeout(() => this.createChart(), 100);
  }

  trackByScenario(index: number, scenario: ScenarioStatistic): string {
    return scenario.name;
  }
}