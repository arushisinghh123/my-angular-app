import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, map } from 'rxjs/operators';

import { ScenarioService, Scenario } from '../../core/services/scenario.service';
import { SequenceService, Sequence } from '../../core/services/sequence.service';
import { ImageService, FrameMetadata } from '../../core/services/image.service';

interface SequenceSegment {
  start: number;
  end: number;
  hasScenario: boolean;
  width: number;
}

interface TimelineState {
  zoom: number;
  offset: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatAutocompleteModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('sequencesScrollContainer') sequencesScrollContainer!: ElementRef<HTMLDivElement>;

  scenarioControl = new FormControl<Scenario | null>(null);
  sequenceFilterControl = new FormControl<string | Sequence>('');
  frameControl = new FormControl<number | null>({ value: null, disabled: true });
  viewModeControl = new FormControl<string>('all');

  scenarios: Scenario[] = [];
  sequences: Sequence[] = [];
  filteredSequences: Sequence[] = [];
  filteredSequenceOptions!: Observable<Sequence[]>;

  selectedScenario: Scenario | null = null;
  selectedSequence: Sequence | null = null;
  selectedSequenceFromInput: Sequence | null = null;
  currentFrame: number | null = null;
  currentFrameData: FrameMetadata | null = null;

  imageLoading = false;
  frameImageLoaded = false;

  // Individual timeline states
  timelineStates: TimelineState[] = [];
  activeTimelineIndex: number = -1;
  baseSequenceBarWidth = 320;

  private destroy$ = new Subject<void>();

  constructor(
    private scenarioService: ScenarioService,
    private sequenceService: SequenceService,
    private imageService: ImageService
  ) {
    this.filteredSequenceOptions = this.sequenceFilterControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterSequences(name as string) : this.sequences.slice();
      })
    );
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.activeTimelineIndex >= 0) {
      this.onTimelineKeydown(event, this.activeTimelineIndex);
    }
  }

  private loadInitialData(): void {
    this.scenarioService.getScenarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(scenarios => {
        this.scenarios = scenarios;
      });

    this.sequenceService.getAllSequences()
      .pipe(takeUntil(this.destroy$))
      .subscribe(sequences => {
        this.sequences = sequences;
        this.updateFilteredSequences();
      });
  }

  private setupFormListeners(): void {
    this.scenarioControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(scenario => {
        this.selectedScenario = scenario;
        this.updateFilteredSequences();
        this.clearFrameData();
      });

    this.viewModeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFilteredSequences();
      });

    this.sequenceFilterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.selectedSequenceFromInput = typeof value === 'object' ? value : null;
        
        if (this.selectedSequenceFromInput) {
          this.frameControl.enable();
        } else {
          this.frameControl.disable();
          this.frameControl.setValue(null);
        }
        
        this.updateFilteredSequences();
      });

    // Auto-update frame viewer when frame control changes
    this.frameControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(frameNumber => {
        if (frameNumber && this.selectedSequenceFromInput) {
          this.loadFrameData(frameNumber, this.selectedSequenceFromInput);
          this.frameImageLoaded = true;
        }
      });
  }

  private _filterSequences(name: string): Sequence[] {
    const filterValue = name.toLowerCase();
    return this.sequences.filter(sequence =>
      sequence.name.toLowerCase().includes(filterValue)
    );
  }

  private updateFilteredSequences(): void {
    if (!this.selectedScenario) {
      this.filteredSequences = [];
      this.timelineStates = [];
      return;
    }

    let filtered = this.sequences;

    if (this.viewModeControl.value === 'present') {
      filtered = filtered.filter(sequence =>
        sequence.scenarios.some(s => s.scenarioId === this.selectedScenario!.id)
      );
    }

    const nameFilter = typeof this.sequenceFilterControl.value === 'string'
      ? this.sequenceFilterControl.value.toLowerCase()
      : '';
    if (nameFilter) {
      filtered = filtered.filter(sequence =>
        sequence.name.toLowerCase().includes(nameFilter)
      );
    }

    this.filteredSequences = filtered;
    
    // Initialize timeline states for each sequence
    this.timelineStates = filtered.map(() => ({
      zoom: 1,
      offset: 0
    }));
  }

  private loadFrameData(frameNumber: number, sequence: Sequence): void {
    if (!this.selectedScenario) return;

    this.imageLoading = true;
    this.frameImageLoaded = false;
    this.currentFrame = frameNumber;
    this.selectedSequence = sequence;

    this.imageService.getFrameImage(sequence.name, frameNumber, this.selectedScenario.name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (frameData) => {
          this.currentFrameData = frameData;
          this.imageLoading = false;
        },
        error: (error) => {
          console.error('Error loading frame data:', error);
          this.imageLoading = false;
        }
      });
  }

  private clearFrameData(): void {
    this.currentFrame = null;
    this.currentFrameData = null;
    this.selectedSequence = null;
    this.frameImageLoaded = false;
    this.frameControl.setValue(null);
  }

  // Timeline keyboard controls
  onTimelineKeydown(event: KeyboardEvent, timelineIndex: number): void {
    if (timelineIndex < 0 || timelineIndex >= this.timelineStates.length) return;

    const state = this.timelineStates[timelineIndex];
    let handled = false;

    switch (event.key) {
      case '+':
      case '=':
        // Zoom in
        state.zoom = Math.min(5, state.zoom * 1.2);
        handled = true;
        break;
      case '-':
        // Zoom out
        state.zoom = Math.max(0.2, state.zoom / 1.2);
        handled = true;
        break;
      case 'ArrowLeft':
        // Scroll left
        state.offset = Math.max(0, state.offset - 50);
        handled = true;
        break;
      case 'ArrowRight':
        // Scroll right
        const maxOffset = Math.max(0, this.getTimelineWidth(timelineIndex) - this.baseSequenceBarWidth);
        state.offset = Math.min(maxOffset, state.offset + 50);
        handled = true;
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  setActiveTimeline(index: number): void {
    this.activeTimelineIndex = index;
  }

  clearActiveTimeline(): void {
    this.activeTimelineIndex = -1;
  }

  getTimelineZoom(timelineIndex: number): number {
    if (timelineIndex >= this.timelineStates.length) return 100;
    return Math.round(this.timelineStates[timelineIndex].zoom * 100);
  }

  getTimelineWidth(timelineIndex: number): number {
    if (timelineIndex >= this.timelineStates.length) return this.baseSequenceBarWidth;
    return this.baseSequenceBarWidth * this.timelineStates[timelineIndex].zoom;
  }

  getTimelineOffset(timelineIndex: number): number {
    if (timelineIndex >= this.timelineStates.length) return 0;
    return -this.timelineStates[timelineIndex].offset;
  }

  shouldShowThumbnail(timelineIndex: number, segment: SequenceSegment): boolean {
    if (timelineIndex >= this.timelineStates.length) return false;
    const zoom = this.timelineStates[timelineIndex].zoom;
    return zoom > 2; // Show thumbnails when zoomed in beyond 200%
  }

  getSegmentThumbnail(segment: SequenceSegment, sequence: Sequence): string {
    const frameNumber = Math.floor((segment.start + segment.end) / 2);
    const hash = frameNumber % 12;
    const imageIds = [
      '378570', '1105766', '2253275', '210019', '1059040', '125510',
      '1118873', '2448749', '315938', '1108099', '2885320', '3593922'
    ];
    return `https://images.pexels.com/photos/${imageIds[hash]}/pexels-photo-${imageIds[hash]}.jpeg?auto=compress&cs=tinysrgb&w=120&h=80&fit=crop`;
  }

  canGoToFrame(): boolean {
    return !!(this.selectedSequenceFromInput && this.frameControl.value && this.frameControl.enabled);
  }

  goToFrame(): void {
    const frameNumber = this.frameControl.value;
    if (frameNumber && this.selectedSequenceFromInput) {
      this.loadFrameData(frameNumber, this.selectedSequenceFromInput);
      this.frameImageLoaded = true;
    }
  }

  displaySequenceName(sequence: Sequence): string {
    return sequence?.name ?? '';
  }

  navigateFrame(delta: number): void {
    if (!this.currentFrame || !this.selectedSequence) return;

    const newFrame = this.currentFrame + delta;
    const maxFrames = this.selectedSequence.totalFrames || 5678;

    if (newFrame >= 1 && newFrame <= maxFrames) {
      this.frameControl.setValue(newFrame);
      // Frame will auto-update due to valueChanges subscription
    }
  }

  canNavigate(delta: number): boolean {
    if (!this.currentFrame || !this.selectedSequence) return false;

    const newFrame = this.currentFrame + delta;
    const maxFrames = this.selectedSequence.totalFrames || 5678;

    return newFrame >= 1 && newFrame <= maxFrames;
  }

  playSequence(): void {
    console.log('Playing sequence:', this.selectedSequence?.name);
  }

  getSequenceSegments(sequence: Sequence, timelineIndex: number): SequenceSegment[] {
    if (!this.selectedScenario || timelineIndex >= this.timelineStates.length) return [];

    const totalFrames = sequence.totalFrames || 1000;
    const segments: SequenceSegment[] = [];
    const zoom = this.timelineStates[timelineIndex].zoom;
    const segmentSize = Math.max(1, Math.floor(totalFrames / (40 * zoom)));

    for (let i = 0; i < totalFrames; i += segmentSize) {
      const end = Math.min(i + segmentSize, totalFrames);
      const hasScenario = this.determineSegmentScenarioPresence(i, end, sequence);

      segments.push({
        start: i,
        end,
        hasScenario,
        width: ((end - i) / totalFrames) * 100
      });
    }

    return segments;
  }

  getSegmentWidth(segment: SequenceSegment, timelineIndex: number): number {
    const timelineWidth = this.getTimelineWidth(timelineIndex);
    return (timelineWidth * segment.width) / 100;
  }

  private determineSegmentScenarioPresence(start: number, end: number, sequence: Sequence): boolean {
    const scenarioData = sequence.scenarios.find(s => s.scenarioId === this.selectedScenario!.id);
    if (!scenarioData) return false;

    const hash = (start + end + sequence.id.length) % 100;
    return hash < scenarioData.percentage;
  }

  getSequencePercentage(sequence: Sequence): number {
    if (!this.selectedScenario) return 0;

    const scenarioData = sequence.scenarios.find(s => s.scenarioId === this.selectedScenario!.id);
    return scenarioData ? scenarioData.percentage : 0;
  }

  getSegmentTooltip(segment: SequenceSegment, sequence: Sequence): string {
    const frameNumber = Math.floor((segment.start + segment.end) / 2);
    const status = segment.hasScenario ? 'Present' : 'Absent';
    
    // Calculate frame fraction for tooltip
    const totalFrames = sequence.totalFrames || 1000;
    const scenarioData = sequence.scenarios.find(s => s.scenarioId === this.selectedScenario!.id);
    const percentage = scenarioData ? scenarioData.percentage : 0;
    const scenarioFrames = Math.floor((totalFrames * percentage) / 100);
    
    return `Frame ${frameNumber}: ${this.selectedScenario?.name} ${status}\n${scenarioFrames}/${totalFrames} frames have ${this.selectedScenario?.name} present (${percentage}%)`;
  }

  getSummaryTooltip(sequence: Sequence): string {
    if (!this.selectedScenario) return '';
    
    const percentage = this.getSequencePercentage(sequence);
    const totalFrames = sequence.totalFrames || 1000;
    const scenarioFrames = Math.floor((totalFrames * percentage) / 100);
    
    return `${scenarioFrames}/${totalFrames} frames have ${this.selectedScenario.name} present (${percentage}%)`;
  }

  onSegmentClick(sequence: Sequence, segment: SequenceSegment): void {
    if (!this.selectedScenario) return;

    const frameNumber = Math.floor((segment.start + segment.end) / 2);
    this.frameControl.setValue(frameNumber);
    this.selectedSequenceFromInput = sequence;
    this.frameControl.enable();
    // Frame will auto-update due to valueChanges subscription
  }

  onImageLoad(): void {
    this.imageLoading = false;
  }

  onImageError(): void {
    this.imageLoading = false;
    console.error('Failed to load frame image');
  }

  trackBySegment(index: number, segment: SequenceSegment): string {
    return `${segment.start}-${segment.end}`;
  }

  get Math() {
    return Math;
  }
}