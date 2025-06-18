import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DashCamData {
  id: string;
  timestamp: Date;
  scenario: string;
  sequence: string;
  frameCount: number;
  metadata: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSubject = new BehaviorSubject<DashCamData[]>([]);
  public data$ = this.dataSubject.asObservable();

  private selectedScenarioSubject = new BehaviorSubject<string | null>(null);
  public selectedScenario$ = this.selectedScenarioSubject.asObservable();

  private selectedSequenceSubject = new BehaviorSubject<string | null>(null);
  public selectedSequence$ = this.selectedSequenceSubject.asObservable();

  private selectedFrameSubject = new BehaviorSubject<number | null>(null);
  public selectedFrame$ = this.selectedFrameSubject.asObservable();

  constructor() {}

  // Data management methods
  loadData(): Observable<DashCamData[]> {
    // TODO: Implement actual data loading logic
    return this.data$;
  }

  // Selection management methods
  selectScenario(scenario: string): void {
    this.selectedScenarioSubject.next(scenario);
  }

  selectSequence(sequence: string): void {
    this.selectedSequenceSubject.next(sequence);
  }

  selectFrame(frame: number): void {
    this.selectedFrameSubject.next(frame);
  }

  // Getter methods
  getSelectedScenario(): string | null {
    return this.selectedScenarioSubject.value;
  }

  getSelectedSequence(): string | null {
    return this.selectedSequenceSubject.value;
  }

  getSelectedFrame(): number | null {
    return this.selectedFrameSubject.value;
  }
}