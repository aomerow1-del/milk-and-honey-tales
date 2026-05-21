import { strings } from './strings';
import type { TranslationStrings } from './strings';

export class LocaleManager {
  private static instance: LocaleManager;
  private currentLocale: 'en' | 'he' = 'en';
  private listeners: (() => void)[] = [];

  private constructor() {
    this.updateDocumentDirection();
  }

  public static getInstance(): LocaleManager {
    if (!LocaleManager.instance) {
      LocaleManager.instance = new LocaleManager();
    }
    return LocaleManager.instance;
  }

  public getLocale(): 'en' | 'he' {
    return this.currentLocale;
  }

  public setLocale(locale: 'en' | 'he'): void {
    if (this.currentLocale !== locale) {
      this.currentLocale = locale;
      this.updateDocumentDirection();
      this.notifyListeners();
    }
  }

  public toggleLocale(): void {
    this.setLocale(this.currentLocale === 'en' ? 'he' : 'en');
  }

  public getStrings(): TranslationStrings {
    return strings[this.currentLocale];
  }

  public getCanvasDirection(): 'ltr' | 'rtl' {
    return this.currentLocale === 'he' ? 'rtl' : 'ltr';
  }

  public getTextAlign(): CanvasTextAlign {
    return this.currentLocale === 'he' ? 'right' : 'left';
  }

  public addChangeListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  public removeChangeListener(listener: () => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in locale listener:', e);
      }
    });
  }

  private updateDocumentDirection(): void {
    document.documentElement.dir = this.currentLocale === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLocale;
  }
}
