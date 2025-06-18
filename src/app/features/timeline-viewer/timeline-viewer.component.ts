import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Scenario } from '../../core/services/scenario.service';
import { Sequence } from '../../core/services/sequence.service';
import {
  TimelineService,
  TimelineData,
  TimelineFrame
} from '../../core/services/timeline.service';

@Component({
  selector: 'app-timeline-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './timeline-viewer.component.html',
  styleUrls: ['./timeline-viewer.component.scss']
})
export class TimelineViewerComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() selectedScenario: Scenario | null = null;
  @Input() selectedSequence: Sequence | null = null;
  @Input() selectedFrameNumber: number | null = null;
  @Output() frameSelected = new EventEmitter<number>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  timelineData: TimelineData | null = null;
  isLoading = false;
  hasError = false;

  zoomLevel = 1;
  minZoom = 0.5;
  maxZoom = 3;
  baseFrameWidth = 60;

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {
    this.loadTimelineData();
  }

  ngAfterViewInit(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          if (event.shiftKey) {
            event.preventDefault();
            this.scrollContainer.nativeElement.scrollLeft += event.deltaY;
          } else if (event.ctrlKey) {
            event.preventDefault();
            if (event.deltaY < 0) this.zoomIn();
            else this.zoomOut();
          }
        },
        { passive: false }
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['selectedSequence'] && this.selectedSequence) ||
      (changes['selectedScenario'] && this.selectedScenario)
    ) {
      this.loadTimelineData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTimelineData(): void {
    if (!this.selectedSequence || !this.selectedScenario) {
      this.timelineData = null;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.timelineService
      .getTimelineData(
        this.selectedSequence.id,
        this.selectedSequence.name,
        this.selectedScenario.id,
        this.selectedScenario.name,
        this.selectedSequence.totalFrames || 1000
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.timelineData = data;
          this.hasError = false;
        },
        error: (error) => {
          console.error('Error loading timeline data:', error);
          this.hasError = true;
          this.timelineData = null;
        }
      });
  }

  onFrameClick(frameNumber: number): void {
    this.frameSelected.emit(frameNumber);
  }

  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
    }
  }

  scrollTimeline(direction: 'left' | 'right'): void {
    const scrollAmount = this.frameSpacing * 5;
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  }

  get frameWidth(): number {
    return this.baseFrameWidth * this.zoomLevel;
  }

  private get frameSpacing(): number {
    return this.frameWidth + 2;
  }

  get timelineWidth(): number {
    if (!this.timelineData) return 0;
    return this.frameSpacing * this.timelineData.frames.length + 16;
  }

  getScaleMarkers(): TimelineFrame[] {
    if (!this.timelineData) return [];
    const step = Math.max(1, Math.floor(10 / this.zoomLevel));
    return this.timelineData.frames.filter((_, index) => index % step === 0);
  }

  getScalePosition(frameNumber: number): number {
    if (!this.timelineData) return 0;
    const frameIndex = this.timelineData.frames.findIndex(
      (f) => f.frameNumber === frameNumber
    );
    return frameIndex === -1 ? 0 : this.frameSpacing * frameIndex + 8;
  }

  get formattedFrameCount(): string {
    return new Intl.NumberFormat().format(this.timelineData?.frames.length || 0);
  }

  trackByFrame(index: number, frame: TimelineFrame): number {
    return frame.frameNumber;
  }
}
