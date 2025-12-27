import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentTheme: 'light' | 'dark' = 'dark'; // Default to dark as per original design preference

    constructor() {
        // Check local storage or system preference could go here
        this.setTheme(this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
    }

    private setTheme(theme: 'light' | 'dark') {
        document.documentElement.setAttribute('data-theme', theme);
    }

    getTheme() {
        return this.currentTheme;
    }
}
