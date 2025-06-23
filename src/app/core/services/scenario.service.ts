import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Scenario {
  id: string;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScenarioService {
  private scenarios: Scenario[] = [
    { id: '1', name: 'City', description: 'Urban driving scenarios' },
    { id: '2', name: 'Clear Sky', description: 'Clear weather conditions' },
    { id: '3', name: 'Tunnel', description: 'Driving through tunnels' },
    { id: '4', name: 'Rain', description: 'Wet weather conditions' },
    { id: '5', name: 'Highway', description: 'High-speed highway driving' },
    { id: '6', name: 'Country Road', description: 'Rural and countryside driving' },
    { id: '7', name: 'Snowfall', description: 'Snow weather conditions' },
    { id: '8', name: 'Ice', description: 'Icy road conditions' },
    { id: '9', name: 'StandingCloseToExtendedObject', description: 'Standing close to extended objects' }
  ];

  constructor() {}

  getScenarios(): Observable<Scenario[]> {
    return of(this.scenarios);
  }

  getScenarioById(id: string): Observable<Scenario | undefined> {
    const scenario = this.scenarios.find(s => s.id === id);
    return of(scenario);
  }

  getScenarioByName(name: string): Observable<Scenario | undefined> {
    const scenario = this.scenarios.find(s => s.name === name);
    return of(scenario);
  }
}