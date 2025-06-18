import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Sequence } from '../../core/services/sequence.service';

@Component({
  selector: 'app-distribution-graph',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './distribution-graph.component.html',
  styleUrls: ['./distribution-graph.component.scss']
})
export class DistributionGraphComponent implements OnInit {
  @Input() selectedSequence: Sequence | null = null;
  @Input() selectedFrame: number | null = null;

  constructor() { }

  ngOnInit(): void {
  }
}