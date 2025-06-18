import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Sequence } from '../../core/services/sequence.service';
import { Scenario } from '../../core/services/scenario.service';
import { ImageService, FrameMetadata } from '../../core/services/image.service';

@Component({
  selector: 'app-frame-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './frame-viewer.component.html',
  styleUrls: ['./frame-viewer.component.scss']
})
export class FrameViewerComponent implements OnInit, OnDestroy {
  @Input() selectedSequence: Sequence | null = null;
  @Input() selectedScenario: Scenario | null = null;

  pendingFrameNumber: number | null = null;
  confirmedFrameNumber: number | null = null;

  frameMetadata: FrameMetadata | null = null;
  isLoading = false;
  hasError = false;

  private destroy$ = new Subject<void>();

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSelectedFrame(): void {
    if (!this.selectedSequence || this.pendingFrameNumber === null) return;

    this.confirmedFrameNumber = this.pendingFrameNumber;
    this.loadFrameData();
  }

private loadFrameData(): void {
  this.hasError = false;
  this.frameMetadata = null;

  if (!this.selectedSequence || this.confirmedFrameNumber === null) {
    this.isLoading = false;
    return;
  }

  this.isLoading = true;

  this.imageService.getFrameImage(
    this.selectedSequence.name, // ✅ now safe after null check
    this.confirmedFrameNumber,
    this.selectedScenario?.name // optional chaining still safe
  )
  .pipe(
    takeUntil(this.destroy$),
    finalize(() => this.isLoading = false)
  )
  .subscribe({
    next: (metadata) => {
      this.frameMetadata = metadata;
      this.hasError = false;
    },
    error: (error) => {
      console.error('Error loading frame data:', error);
      this.hasError = true;
      this.frameMetadata = null;
    }
  });
}

  onImageLoad(): void {
    this.hasError = false;
  }

  onImageError(): void {
    this.hasError = true;
  }

  retryLoad(): void {
    this.loadFrameData();
  }
}
