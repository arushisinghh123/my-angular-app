import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Sequence {
  id: string;
  name: string;
  totalFrames?: number;
  description?: string;
  scenarios: { scenarioId: string; percentage: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class SequenceService {
  private sequences: Sequence[] = [
    {
      id: '1',
      name: 'Morning Commute',
      totalFrames: 1200,
      description: 'Daily morning drive to work',
      scenarios: [
        { scenarioId: '2', percentage: 85 },
        { scenarioId: '10', percentage: 70 },
        { scenarioId: '4', percentage: 45 }
      ]
    },
    {
      id: '2',
      name: 'Highway Journey',
      totalFrames: 2000,
      description: 'Long distance highway travel',
      scenarios: [
        { scenarioId: '4', percentage: 95 },
        { scenarioId: '7', percentage: 30 },
        { scenarioId: '9', percentage: 25 }
      ]
    },
    {
      id: '3',
      name: 'Tunnel Drive',
      totalFrames: 800,
      description: 'Underground tunnel navigation',
      scenarios: [
        { scenarioId: '1', percentage: 100 },
        { scenarioId: '2', percentage: 40 },
        { scenarioId: '5', percentage: 60 }
      ]
    },
    {
      id: '4',
      name: 'Rainy Day Trip',
      totalFrames: 950,
      description: 'Driving in wet conditions',
      scenarios: [
        { scenarioId: '3', percentage: 100 },
        { scenarioId: '2', percentage: 65 },
        { scenarioId: '10', percentage: 55 }
      ]
    },
    {
      id: '5',
      name: 'Night Drive',
      totalFrames: 1100,
      description: 'Evening and night driving',
      scenarios: [
        { scenarioId: '5', percentage: 100 },
        { scenarioId: '4', percentage: 70 },
        { scenarioId: '9', percentage: 50 }
      ]
    },
    {
      id: '6',
      name: 'Winter Conditions',
      totalFrames: 1300,
      description: 'Snow and ice driving',
      scenarios: [
        { scenarioId: '6', percentage: 100 },
        { scenarioId: '9', percentage: 60 },
        { scenarioId: '4', percentage: 40 }
      ]
    },
    {
      id: '7',
      name: 'Construction Zone',
      totalFrames: 900,
      description: 'Navigating through work zones',
      scenarios: [
        { scenarioId: '7', percentage: 100 },
        { scenarioId: '4', percentage: 80 },
        { scenarioId: '10', percentage: 75 }
      ]
    },
    {
      id: '8',
      name: 'Shopping Center',
      totalFrames: 750,
      description: 'Mall and shopping area driving',
      scenarios: [
        { scenarioId: '8', percentage: 90 },
        { scenarioId: '2', percentage: 70 },
        { scenarioId: '10', percentage: 60 }
      ]
    },
    {
      id: '9',
      name: 'Country Road',
      totalFrames: 1250,
      description: 'Rural and countryside driving',
      scenarios: [
        { scenarioId: '9', percentage: 100 },
        { scenarioId: '5', percentage: 45 },
        { scenarioId: '6', percentage: 35 }
      ]
    },
    {
      id: '10',
      name: 'Rush Hour',
      totalFrames: 1400,
      description: 'Peak traffic hours',
      scenarios: [
        { scenarioId: '10', percentage: 100 },
        { scenarioId: '2', percentage: 90 },
        { scenarioId: '7', percentage: 40 }
      ]
    },
    {
      id: '11',
      name: 'Weekend Trip',
      totalFrames: 1600,
      description: 'Leisure weekend driving',
      scenarios: [
        { scenarioId: '4', percentage: 60 },
        { scenarioId: '9', percentage: 70 },
        { scenarioId: '8', percentage: 50 }
      ]
    },
    {
      id: '12',
      name: 'Emergency Response',
      totalFrames: 1000,
      description: 'Urgent driving scenarios',
      scenarios: [
        { scenarioId: '2', percentage: 80 },
        { scenarioId: '4', percentage: 70 },
        { scenarioId: '10', percentage: 85 }
      ]
    }
  ];

  constructor() {}

  getAllSequences(): Observable<Sequence[]> {
    return of(this.sequences);
  }

  getSequencesByScenario(scenarioId: string, minPercentage: number = 0): Observable<Sequence[]> {
    const filteredSequences = this.sequences.filter(sequence =>
      sequence.scenarios.some(scenario => 
        scenario.scenarioId === scenarioId && scenario.percentage >= minPercentage
      )
    );
    return of(filteredSequences);
  }

  getSequenceById(id: string): Observable<Sequence | undefined> {
    const sequence = this.sequences.find(s => s.id === id);
    return of(sequence);
  }

  getScenarioPercentageForSequence(sequenceId: string, scenarioId: string): number {
    const sequence = this.sequences.find(s => s.id === sequenceId);
    if (!sequence) return 0;
    
    const scenarioData = sequence.scenarios.find(s => s.scenarioId === scenarioId);
    return scenarioData ? scenarioData.percentage : 0;
  }
}
