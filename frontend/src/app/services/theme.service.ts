import { Injectable } from '@angular/core';
import { defaultAppearanceSettings, Settings } from './settings.service';
import { Subscription } from '@actioncrew/streamix';
import { AppearanceSettings } from '../interfaces/settings';

export type Theme = 'light' | 'dark' | 'default';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  appearance!: AppearanceSettings;
  subscriptions: Subscription[] = [];

  constructor(private settings: Settings) {
    queueMicrotask(() => {
      this.subscriptions.push(settings.appearance.subscribe((value) => { this.appearance = value; }));
    });
  }

  /** Sets the theme and merges into existing appearance settings */
  async setTheme(theme: Theme): Promise<void> {
    this.settings.appearance.next({ ...this.appearance, theme });
    document.body.classList.remove('ion-theme-light', 'ion-theme-dark', 'ion-theme-default');

    if (theme === 'dark') {
      document.body.classList.add('ion-theme-dark');
    } else if (theme === 'light') {
      document.body.classList.add('ion-theme-light');
    } else if (theme === 'default') {
      document.body.classList.add('ion-theme-default'); // optional
    }
  }

  /** Gets the current theme from appearance settings */
  async getCurrentTheme(): Promise<Theme> {
    return this.appearance?.theme ?? this.settings.appearance.snappy?.theme;
  }

  /** Initializes theme on app startup */
  async initTheme(): Promise<void> {
    const theme = await this.getCurrentTheme();
    await this.setTheme(theme);
  }

  /** Cycles between dark → light → default */
  async cycleTheme(): Promise<void> {
    const current = await this.getCurrentTheme();
    const next: Theme = current === 'dark' ? 'light' : current === 'light' ? 'default' : 'dark';
    await this.setTheme(next);
  }
}
