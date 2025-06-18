import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-image-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './image-popup.component.html',
  styleUrls: ['./image-popup.component.scss']
})
export class ImagePopupComponent implements OnInit {
  @Input() imagePath: string = '';
  @Input() frameNumber: number = 0;
  @Input() sequenceName: string = '';
  @Input() scenarioName: string = '';
  @Input() scenarioPresence: boolean = false;
  @Output() closePopup = new EventEmitter<void>();

  @ViewChild('imageWrapper') imageWrapper!: ElementRef<HTMLDivElement>;

  // Image state
  isLoading = true;
  hasError = false;
  isTransitioning = false;

  // Transform properties
  zoomLevel = 1;
  rotation = 0;
  panX = 0;
  panY = 0;

  // Zoom limits
  minZoom = 0.5;
  maxZoom = 5;

  // Pan state
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor() {}

  ngOnInit(): void {
    this.loadImage();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.onClose();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        this.rotateRight();
        break;
      case '0':
        event.preventDefault();
        this.resetAll();
        break;
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (this.zoomLevel > 1) {
      this.isDragging = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.zoomLevel > 1) {
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;
      
      this.panX += deltaX;
      this.panY += deltaY;
      
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  private loadImage(): void {
    this.isLoading = true;
    this.hasError = false;
  }

  onImageLoad(): void {
    this.isLoading = false;
    this.hasError = false;
  }

  onImageError(): void {
    this.isLoading = false;
    this.hasError = true;
  }

  retryLoad(): void {
    this.loadImage();
  }

  // Zoom controls
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.isTransitioning = true;
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.25);
      setTimeout(() => this.isTransitioning = false, 300);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.isTransitioning = true;
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.25);
      
      // Reset pan if zoomed out too much
      if (this.zoomLevel <= 1) {
        this.panX = 0;
        this.panY = 0;
      }
      
      setTimeout(() => this.isTransitioning = false, 300);
    }
  }

  resetZoom(): void {
    this.isTransitioning = true;
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    setTimeout(() => this.isTransitioning = false, 300);
  }

  // Rotation controls
  rotateLeft(): void {
    this.isTransitioning = true;
    this.rotation = (this.rotation - 90) % 360;
    setTimeout(() => this.isTransitioning = false, 300);
  }

  rotateRight(): void {
    this.isTransitioning = true;
    this.rotation = (this.rotation + 90) % 360;
    setTimeout(() => this.isTransitioning = false, 300);
  }

  resetRotation(): void {
    this.isTransitioning = true;
    this.rotation = 0;
    setTimeout(() => this.isTransitioning = false, 300);
  }

  // Pan controls
  resetPan(): void {
    this.isTransitioning = true;
    this.panX = 0;
    this.panY = 0;
    setTimeout(() => this.isTransitioning = false, 300);
  }

  // Reset all transformations
  resetAll(): void {
    this.isTransitioning = true;
    this.zoomLevel = 1;
    this.rotation = 0;
    this.panX = 0;
    this.panY = 0;
    setTimeout(() => this.isTransitioning = false, 300);
  }

  // Get combined transform string
  getImageTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel}) rotate(${this.rotation}deg)`;
  }

  // Event handlers
  onClose(): void {
    this.closePopup.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  downloadImage(): void {
    if (this.imagePath) {
      const link = document.createElement('a');
      link.href = this.imagePath;
      link.download = `frame_${this.frameNumber}_${this.sequenceName}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}