export interface TranslationStrings {
  title: string;
  subtitle: string;
  regionLoading: string;
  langSwitch: string;
  hint: string;
}

export const strings: Record<'en' | 'he', TranslationStrings> = {
  en: {
    title: 'Milk & Honey Tales',
    subtitle: 'Bilingual Isometric 2D Engine',
    regionLoading: 'Loading region: Judean Hills...',
    langSwitch: 'עברית (HE)',
    hint: 'Use Keyboard Arrow Keys or WASD to walk. Hover cursor over tiles. Double-click to ripple.',
  },
  he: {
    title: 'עלילות חלב ודבש',
    subtitle: 'מנוע דו-ממדי איזומטרי דו-לשוני',
    regionLoading: 'טוען אזור: הרי יהודה...',
    langSwitch: 'English (EN)',
    hint: 'השתמש במקשי החצים או WASD כדי ללכת. רחף עם העכבר מעל האריחים. קליק כפול לגל גלים.',
  }
};
