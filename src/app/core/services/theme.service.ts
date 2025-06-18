import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();

  constructor() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('darkMode');
    const isDarkMode = savedTheme ? JSON.parse(savedTheme) : false;
    this.setDarkMode(isDarkMode);
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  setDarkMode(isDarkMode: boolean): void {
    this.darkModeSubject.next(isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Apply theme to document body
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode());
  }
}