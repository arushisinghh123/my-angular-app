import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Sequence } from '../../core/services/sequence.service';

@Component({
  selector: 'app-frame-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  templateUrl: './frame-selector.component.html',
  styleUrls: ['./frame-selector.component.scss']
})
export class FrameSelectorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedSequence: Sequence | null = null;
  @Output() frameSelected = new EventEmitter<number>();

  frameControl = new FormControl<number | null>(
    { value: null, disabled: true },
    [
      Validators.required,
      Validators.min(1),
      Validators.max(5678),
      Validators.pattern(/^\d+$/)
    ]
  );

  maxFrames = 5678;
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.setupFrameSelectionListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedSequence']) {
      this.onSequenceChange();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFrameSelectionListener(): void {
    this.frameControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((frameNumber) => {
        if (frameNumber !== null && this.frameControl.valid) {
          this.frameSelected.emit(frameNumber);
        }
      });
  }

  private onSequenceChange(): void {
    this.frameControl.setValue(null);

    if (this.selectedSequence) {
      this.maxFrames = this.selectedSequence.totalFrames || 5678;
      this.updateValidators();
      this.frameControl.enable();
    } else {
      this.frameControl.disable();
    }
  }

  private updateValidators(): void {
    this.frameControl.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.maxFrames),
      Validators.pattern(/^\d+$/)
    ]);
    this.frameControl.updateValueAndValidity();
  }

  setFrame(frameNumber: number): void {
    if (
      this.selectedSequence &&
      frameNumber >= 1 &&
      frameNumber <= this.maxFrames
    ) {
      this.frameControl.setValue(frameNumber);
    }
  }

  clearFrame(): void {
    this.frameControl.setValue(null);
  }

  get Math() {
    return Math;
  }
}
