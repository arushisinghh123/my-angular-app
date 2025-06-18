import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface TimelineFrame {
  frameNumber: number;
  timestamp: string;
  scenarioPresence: boolean;
  confidence?: number;
  thumbnailUrl?: string;
}

export interface TimelineData {
  sequenceId: string;
  sequenceName: string;
  scenarioId: string;
  scenarioName: string;
  totalFrames: number;
  frames: TimelineFrame[];
}

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private baseImageUrl = 'https://images.pexels.com/photos';
  
  // Mock image URLs for thumbnails
  private thumbnailImages: string[] = [
    '378570/pexels-photo-378570.jpeg',
    '1105766/pexels-photo-1105766.jpeg',
    '2253275/pexels-photo-2253275.jpeg',
    '210019/pexels-photo-210019.jpeg',
    '1059040/pexels-photo-1059040.jpeg',
    '125510/pexels-photo-125510.jpeg',
    '1118873/pexels-photo-1118873.jpeg',
    '2448749/pexels-photo-2448749.jpeg',
    '315938/pexels-photo-315938.jpeg',
    '1108099/pexels-photo-1108099.jpeg',
    '2885320/pexels-photo-2885320.jpeg',
    '3593922/pexels-photo-3593922.jpeg'
  ];

  constructor() {}

  getTimelineData(sequenceId: string, sequenceName: string, scenarioId: string, scenarioName: string, totalFrames: number = 1000): Observable<TimelineData> {
    // Generate sample frames (every 10th frame for performance)
    const frames: TimelineFrame[] = [];
    const frameStep = Math.max(1, Math.floor(totalFrames / 100)); // Show max 100 frames
    
    for (let i = 1; i <= totalFrames; i += frameStep) {
      frames.push({
        frameNumber: i,
        timestamp: this.generateTimestamp(i),
        scenarioPresence: this.determineScenarioPresence(i, scenarioName),
        confidence: this.generateConfidence(),
        thumbnailUrl: this.generateThumbnailUrl(i)
      });
    }

    const timelineData: TimelineData = {
      sequenceId,
      sequenceName,
      scenarioId,
      scenarioName,
      totalFrames,
      frames
    };

    return of(timelineData);
  }

  private generateTimestamp(frameNumber: number): string {
    // Generate timestamp based on frame number (assuming 30 FPS)
    const seconds = Math.floor(frameNumber / 30);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private determineScenarioPresence(frameNumber: number, scenarioName: string): boolean {
    // Mock logic for scenario presence
    const hash = frameNumber + (scenarioName?.length || 0);
    return hash % 3 !== 0; // Roughly 66% presence rate
  }

  private generateConfidence(): number {
    return Math.round((0.7 + Math.random() * 0.29) * 100) / 100;
  }

  private generateThumbnailUrl(frameNumber: number): string {
    const imageIndex = frameNumber % this.thumbnailImages.length;
    const selectedImage = this.thumbnailImages[imageIndex];
    return `${this.baseImageUrl}/${selectedImage}?auto=compress&cs=tinysrgb&w=120&h=80&fit=crop`;
  }
}