export interface TranslationStrings {
  title: string;
  subtitle: string;
  regionLoading: string;
  langSwitch: string;
  hint: string;
  playerGrid: string;
  moving: string;
  hoverTile: string;
  noHoverTile: string;
  regionLabel: string;
  regions: Record<string, string>;
  npcDialogue: string;
}

export const strings: Record<'en' | 'he', TranslationStrings> = {
  en: {
    title: 'Milk & Honey Tales',
    subtitle: 'Bilingual Isometric 2D Engine',
    regionLoading: 'Loading region: Judean Hills...',
    langSwitch: 'עברית (HE)',
    hint: 'Use Keyboard Arrow Keys or WASD to walk. Hover cursor over tiles. Double-click to ripple. Press Space to interact.',
    playerGrid: 'Player Grid',
    moving: ' (Moving...)',
    hoverTile: 'Hover Tile',
    noHoverTile: 'No hover tile',
    regionLabel: 'Region: ',
    regions: {
      'central_district': 'Central District',
      'negev_desert': 'Negev Desert'
    },
    npcDialogue: 'Shalom! Welcome to Milk & Honey Tales. Watch your step around those rocks.'
  },
  he: {
    title: 'עלילות חלב ודבש',
    subtitle: 'מנוע דו-ממדי איזומטרי דו-לשוני',
    regionLoading: 'טוען אזור: הרי יהודה...',
    langSwitch: 'English (EN)',
    hint: 'השתמש במקשי החצים או WASD כדי ללכת. רחף עם העכבר מעל האריחים. קליק כפול לגל גלים. לחץ על רווח כדי ליצור קשר.',
    playerGrid: 'מיקום שחקן',
    moving: ' (בתנועה...)',
    hoverTile: 'רחף אריח',
    noHoverTile: 'אין אריח מסומן',
    regionLabel: 'אזור נוכחי: ',
    regions: {
      'central_district': 'מחוז המרכז',
      'negev_desert': 'מדבר הנגב'
    },
    npcDialogue: 'שלום! ברוכים הבאים לעלילות חלב ודבש. היזהרו כשאתם הולכים ליד הסלעים.'
  }
};
