import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export type Theme = 'light' | 'dark' | 'default';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'appearanceSettings';
  private storageReady = this.storage.create(); // ensure storage is initialized

  constructor(private storage: Storage) {
    this.initTheme(); // apply theme on startup
  }

  /** Sets the theme and merges into existing appearance settings */
  async setTheme(theme: Theme): Promise<void> {
    await this.storageReady;

    const existing = (await this.storage.get(this.THEME_KEY)) || {};
    const updated = { ...existing, theme };

    await this.storage.set(this.THEME_KEY, updated);

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
    await this.storageReady;

    const settings = await this.storage.get(this.THEME_KEY);
    return settings?.theme || 'default';
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
