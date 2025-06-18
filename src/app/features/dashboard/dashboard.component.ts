import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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

  // Timeline zoom and scroll properties
  zoomLevel = 1;
  minZoom = 0.5;
  maxZoom = 3;
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
      this.loadFrameData(newFrame, this.selectedSequence);
      this.frameImageLoaded = true;
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

  // Timeline zoom and scroll methods
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      const oldScrollLeft = this.sequencesScrollContainer?.nativeElement?.scrollLeft || 0;
      const oldWidth = this.timelineWidth;
      
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
      
      setTimeout(() => {
        if (this.sequencesScrollContainer?.nativeElement && oldWidth > 0) {
          const newScrollLeft = (oldScrollLeft / oldWidth) * this.timelineWidth;
          this.sequencesScrollContainer.nativeElement.scrollLeft = newScrollLeft;
        }
      }, 0);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      const oldScrollLeft = this.sequencesScrollContainer?.nativeElement?.scrollLeft || 0;
      const oldWidth = this.timelineWidth;
      
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
      
      setTimeout(() => {
        if (this.sequencesScrollContainer?.nativeElement && oldWidth > 0) {
          const newScrollLeft = (oldScrollLeft / oldWidth) * this.timelineWidth;
          this.sequencesScrollContainer.nativeElement.scrollLeft = newScrollLeft;
        }
      }, 0);
    }
  }

  scrollTimeline(direction: 'left' | 'right'): void {
    const scrollAmount = this.sequenceBarWidth * 0.3;
    if (this.sequencesScrollContainer?.nativeElement) {
      const el = this.sequencesScrollContainer.nativeElement;
      const currentScroll = el.scrollLeft;
      const targetScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(el.scrollWidth - el.clientWidth, currentScroll + scrollAmount);
      
      el.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }

  get sequenceBarWidth(): number {
    return this.baseSequenceBarWidth * this.zoomLevel;
  }

  get timelineWidth(): number {
    return this.sequenceBarWidth + 200; // Add space for labels
  }

  getSequenceSegments(sequence: Sequence): SequenceSegment[] {
    if (!this.selectedScenario) return [];

    const totalFrames = sequence.totalFrames || 1000;
    const segments: SequenceSegment[] = [];
    const segmentSize = Math.max(1, Math.floor(totalFrames / (40 * this.zoomLevel)));

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

  getSegmentWidth(segment: SequenceSegment): number {
    return (this.sequenceBarWidth * segment.width) / 100;
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
    return `Frame ${frameNumber}: ${this.selectedScenario?.name} ${status}`;
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
    this.loadFrameData(frameNumber, sequence);
    this.frameImageLoaded = true;
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