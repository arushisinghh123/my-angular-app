import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Scenario } from '../../core/services/scenario.service';

@Component({
  selector: 'app-summary-graph',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './summary-graph.component.html',
  styleUrls: ['./summary-graph.component.scss']
})
export class SummaryGraphComponent implements OnInit {
  @Input() selectedScenario: Scenario | null = null;

  constructor() { }

  ngOnInit(): void {
  }
}