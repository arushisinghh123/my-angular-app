import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface FrameMetadata {
  sequenceName: string;
  frameNumber: number;
  scenarioPresence: boolean;
  imagePath: string;
  timestamp?: string;
  confidence?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseImageUrl = 'https://images.pexels.com/photos';
  
  // Mock image URLs from Pexels for different scenarios
  private scenarioImages: { [key: string]: string[] } = {
    'Tunnel': [
      '1108099/pexels-photo-1108099.jpeg',
      '2885320/pexels-photo-2885320.jpeg',
      '3593922/pexels-photo-3593922.jpeg'
    ],
    'City': [
      '378570/pexels-photo-378570.jpeg',
      '1105766/pexels-photo-1105766.jpeg',
      '2253275/pexels-photo-2253275.jpeg'
    ],
    'Rain': [
      '125510/pexels-photo-125510.jpeg',
      '1118873/pexels-photo-1118873.jpeg',
      '2448749/pexels-photo-2448749.jpeg'
    ],
    'Highway': [
      '210019/pexels-photo-210019.jpeg',
      '1059040/pexels-photo-1059040.jpeg',
      '2253275/pexels-photo-2253275.jpeg'
    ],
    'Night': [
      '315938/pexels-photo-315938.jpeg',
      '1108099/pexels-photo-1108099.jpeg',
      '2448749/pexels-photo-2448749.jpeg'
    ],
    'Snow': [
      '1118873/pexels-photo-1118873.jpeg',
      '2885320/pexels-photo-2885320.jpeg',
      '3593922/pexels-photo-3593922.jpeg'
    ],
    'Construction': [
      '2253275/pexels-photo-2253275.jpeg',
      '1059040/pexels-photo-1059040.jpeg',
      '378570/pexels-photo-378570.jpeg'
    ],
    'Parking': [
      '1105766/pexels-photo-1105766.jpeg',
      '210019/pexels-photo-210019.jpeg',
      '125510/pexels-photo-125510.jpeg'
    ],
    'Rural': [
      '3593922/pexels-photo-3593922.jpeg',
      '2885320/pexels-photo-2885320.jpeg',
      '1118873/pexels-photo-1118873.jpeg'
    ],
    'Traffic': [
      '2448749/pexels-photo-2448749.jpeg',
      '315938/pexels-photo-315938.jpeg',
      '1108099/pexels-photo-1108099.jpeg'
    ]
  };

  constructor() {}

  getFrameImage(sequenceName: string, frameNumber: number, scenarioName?: string): Observable<FrameMetadata> {
    // Simulate API delay
    const metadata: FrameMetadata = {
      sequenceName,
      frameNumber,
      scenarioPresence: this.determineScenarioPresence(frameNumber, scenarioName),
      imagePath: this.generateImagePath(sequenceName, frameNumber, scenarioName),
      timestamp: this.generateTimestamp(frameNumber),
      confidence: this.generateConfidence()
    };

    return of(metadata).pipe(delay(Math.random() * 1000 + 500)); // 500-1500ms delay
  }

  private generateImagePath(sequenceName: string, frameNumber: number, scenarioName?: string): string {
    let imagePool: string[] = [];
    
    if (scenarioName && this.scenarioImages[scenarioName]) {
      imagePool = this.scenarioImages[scenarioName];
    } else {
      // Use all images if no specific scenario
      imagePool = Object.values(this.scenarioImages).flat();
    }

    // Use frame number to consistently select the same image for the same frame
    const imageIndex = (frameNumber + sequenceName.length) % imagePool.length;
    const selectedImage = imagePool[imageIndex];
    
    return `${this.baseImageUrl}/${selectedImage}?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;
  }

  private determineScenarioPresence(frameNumber: number, scenarioName?: string): boolean {
    if (!scenarioName) return false;
    
    // Mock logic: scenario presence based on frame number and scenario
    const hash = frameNumber + (scenarioName?.length || 0);
    return hash % 3 !== 0; // Roughly 66% presence rate
  }

  private generateTimestamp(frameNumber: number): string {
    // Generate a mock timestamp based on frame number (assuming 30 FPS)
    const seconds = Math.floor(frameNumber / 30);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private generateConfidence(): number {
    // Generate a random confidence score between 0.7 and 0.99
    return Math.round((0.7 + Math.random() * 0.29) * 100) / 100;
  }
}