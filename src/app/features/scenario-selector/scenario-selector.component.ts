import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ScenarioService, Scenario } from '../../core/services/scenario.service';

@Component({
  selector: 'app-scenario-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './scenario-selector.component.html',
  styleUrls: ['./scenario-selector.component.scss']
})
export class ScenarioSelectorComponent implements OnInit, OnDestroy {
  @Output() scenarioSelected = new EventEmitter<Scenario>();

  scenarioControl = new FormControl<string | Scenario>('');
  scenarios: Scenario[] = [];
  filteredScenarios$: Observable<Scenario[]>;
  
  private destroy$ = new Subject<void>();

  constructor(private scenarioService: ScenarioService) {
    this.filteredScenarios$ = this.scenarioControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filter(name as string) : this.scenarios.slice();
      })
    );
  }

  ngOnInit(): void {
    this.loadScenarios();
    this.setupSelectionListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadScenarios(): void {
    this.scenarioService.getScenarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(scenarios => {
        this.scenarios = scenarios;
      });
  }

  private setupSelectionListener(): void {
    this.scenarioControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (typeof value === 'object' && value !== null) {
          this.scenarioSelected.emit(value as Scenario);
        }
      });
  }

  private _filter(name: string): Scenario[] {
    const filterValue = name.toLowerCase();
    return this.scenarios.filter(scenario => 
      scenario.name.toLowerCase().includes(filterValue)
    );
  }

  displayFn(scenario: Scenario): string {
    return scenario && scenario.name ? scenario.name : '';
  }

  onScenarioSelected(scenario: Scenario): void {
    this.scenarioSelected.emit(scenario);
  }

  clearSelection(): void {
    this.scenarioControl.setValue('');
  }
}