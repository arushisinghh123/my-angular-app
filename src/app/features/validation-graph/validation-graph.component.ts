import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Scenario } from '../../core/services/scenario.service';
import { Sequence } from '../../core/services/sequence.service';

@Component({
  selector: 'app-validation-graph',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './validation-graph.component.html',
  styleUrls: ['./validation-graph.component.scss']
})
export class ValidationGraphComponent implements OnInit {
  @Input() selectedScenario: Scenario | null = null;
  @Input() selectedSequence: Sequence | null = null;

  constructor() { }

  ngOnInit(): void {
  }
}