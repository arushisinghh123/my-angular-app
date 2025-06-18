import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SequenceService, Sequence } from '../../core/services/sequence.service';
import { Scenario } from '../../core/services/scenario.service';

@Component({
  selector: 'app-sequence-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './sequence-selector.component.html',
  styleUrls: ['./sequence-selector.component.scss']
})
export class SequenceSelectorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedScenario: Scenario | null = null;
  @Output() sequenceSelected = new EventEmitter<Sequence>();

  sequenceControl = new FormControl<Sequence | null>(null);
  sequences: Sequence[] = [];
  filteredSequences: Sequence[] = [];
  showAllSequences = false;
  
  private destroy$ = new Subject<void>();

  constructor(private sequenceService: SequenceService) {}

  ngOnInit(): void {
    this.loadAllSequences();
    this.setupSelectionListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedScenario']) {
      this.onScenarioChange();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllSequences(): void {
    this.sequenceService.getAllSequences()
      .pipe(takeUntil(this.destroy$))
      .subscribe(sequences => {
        this.sequences = sequences;
        this.updateFilteredSequences();
      });
  }

  private setupSelectionListener(): void {
    this.sequenceControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sequence => {
        if (sequence) {
          this.sequenceSelected.emit(sequence);
        }
      });
  }

  private onScenarioChange(): void {
    this.sequenceControl.setValue(null);
    this.showAllSequences = false;
    this.updateFilteredSequences();
  }

  private updateFilteredSequences(): void {
    if (!this.selectedScenario || this.showAllSequences) {
      this.filteredSequences = this.sequences;
    } else {
      this.sequenceService.getSequencesByScenario(this.selectedScenario.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(sequences => {
          this.filteredSequences = sequences;
        });
    }
  }

  onShowAllSequences(): void {
    this.showAllSequences = true;
    this.updateFilteredSequences();
  }

  onShowFilteredSequences(): void {
    this.showAllSequences = false;
    this.updateFilteredSequences();
  }

  clearSelection(): void {
    this.sequenceControl.setValue(null);
  }

  getScenarioPercentage(sequence: Sequence): number {
    if (!this.selectedScenario) return 0;
    return this.sequenceService.getScenarioPercentageForSequence(sequence.id, this.selectedScenario.id);
  }

  get hasScenarioSelected(): boolean {
    return !!this.selectedScenario;
  }

  get filteredSequenceCount(): number {
    return this.filteredSequences.length;
  }

  get totalSequenceCount(): number {
    return this.sequences.length;
  }
}