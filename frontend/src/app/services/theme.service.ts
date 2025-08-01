import { Injectable } from '@angular/core';
import { defaultAppearanceSettings, Settings } from './settings.service';
import { Subscription, distinctUntilChanged } from '@actioncrew/streamix';
import { AppFontSize } from '../interfaces/settings';


export type Theme = 'light' | 'dark' | 'default';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly fontSizeMap: Record<AppFontSize, string> = {
    small: '14px',
    medium: '16px',
    large: '18px'
  };

  constructor(private settings: Settings) {
  }

  /** Sets the theme and merges into existing appearance settings */
  async setTheme(theme: Theme): Promise<void> {
    this.settings.appearance.next({ ...this.settings.appearance.snappy!, theme });
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
    return this.settings.appearance?.snappy?.theme ?? defaultAppearanceSettings.theme;
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

  /** Sets root font-size on <html> based on logical fontSize */
  setRootFontSize(fontSize: AppFontSize): void {
    const cssSize = this.fontSizeMap[fontSize] || this.fontSizeMap.medium;
    document.documentElement.style.fontSize = cssSize;

    this.settings.appearance.next({
      ...this.settings.appearance.snappy!,
      fontSize
    });
  }

  /** Gets logical font size from current appearance settings */
  getRootFontSize(): AppFontSize {
    return this.settings.appearance.snappy?.fontSize ?? defaultAppearanceSettings.fontSize!;
  }
}
