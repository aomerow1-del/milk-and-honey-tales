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
  inventoryTitle: string;
  emptyInventory: string;
  shekels: string;
  shopTitle: string;
  shopHint: string;
  falafel: string;
  sabraFruit?: string;
  questGranted: string;
  combatTitle: string;
  combatEnemyHealth: string;
  combatPlayerHealth: string;
  combatPlayerMana: string;
  combatControls: string;
  bananoDialogueNeedBamba: string;
  bananoDialogueThanks: string;
  questCompleted: string;
  aravaDialogueNeedSabra: string;
  aravaDialogueThanks: string;
  macabiDialogue: string;
  jarBroken: string;
  oasisHeal: string;
  holyBamba?: string;
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
    npcDialogue: 'Shalom! Welcome to Milk & Honey Tales. Watch your step around those rocks.',
    inventoryTitle: 'Inventory (Press I to close)',
    emptyInventory: 'Your bag is empty.',
    shekels: 'Shekels',
    shopTitle: 'The Shuk (Market)',
    shopHint: '[1] Buy Falafel (20 Shekels)   [2] Close',
    falafel: 'Falafel',
    sabraFruit: 'Sabra Fruit',
    questGranted: '\n[Quest Granted: The First Steps]',
    combatTitle: 'Combat',
    combatEnemyHealth: 'Enemy Health',
    combatPlayerHealth: 'Player Health',
    combatPlayerMana: 'Player Mana',
    combatControls: '[1] Attack   [2] Special Attack (10 MP)   [3] Flee',
    bananoDialogueNeedBamba: 'Beep boop! I am Nano Banano. Bring me the Holy Bamba from the Central District to power my core!',
    bananoDialogueThanks: 'Bzzt! Holy Bamba detected! Power levels over 9000! Thank you, hero. The game is complete!',
    questCompleted: '\n[Quest Completed: The Desert Journey]',
    aravaDialogueNeedSabra: 'Peace be with you. I am Arava. The desert is harsh... If you find a fresh Sabra Fruit, I will trade you 50 Shekels for it.',
    aravaDialogueThanks: 'Ah, a sweet Sabra Fruit! Here are your 50 Shekels. May your journey be safe.',
    macabiDialogue: 'Halt! I am Macabi, guardian of the Central District. I hear the Bamba Golem is causing trouble nearby. Be ready for combat!',
    jarBroken: 'You smashed an ancient jar and found some Shekels!',
    oasisHeal: 'You drank from the Oasis Pool. Health and Mana fully restored.'
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
    npcDialogue: 'שלום! ברוכים הבאים לעלילות חלב ודבש. היזהרו כשאתם הולכים ליד הסלעים.',
    inventoryTitle: 'תרמיל (לחץ I לסגירה)',
    emptyInventory: 'התרמיל שלך ריק.',
    shekels: 'שקלים',
    shopTitle: 'השוק',
    shopHint: '[1] קנה פלאפל (20 שקלים)   [2] סגור',
    falafel: 'פלאפל',
    sabraFruit: 'סברס',
    questGranted: '\n[משימה חדשה: הצעדים הראשונים]',
    combatTitle: 'קרב',
    combatEnemyHealth: 'בריאות אויב',
    combatPlayerHealth: 'בריאות שחקן',
    combatPlayerMana: 'מאנה',
    combatControls: '[1] תקיפה   [2] יכולת מיוחדת (10 MP)   [3] בריחה',
    bananoDialogueNeedBamba: 'ביפ בופ! אני נאנו בננו. הבא לי את הבמבה הקדושה מהמרכז כדי להטעין את הליבה שלי!',
    bananoDialogueThanks: 'בזזז! במבה קדושה זוהתה! רמות האנרגיה מעל 9000! תודה לך, גיבור. המשחק הושלם!',
    questCompleted: '\n[המשימה הושלמה: המסע במדבר]',
    aravaDialogueNeedSabra: 'שלום עליכם. אני ערבה. המדבר אכזר... אם תמצא פרי צבר (סברס) טרי, אתן לך 50 שקלים בתמורה.',
    aravaDialogueThanks: 'אה, פרי צבר מתוק! הנה 50 השקלים שלך. דרך צלחה במסעך.',
    macabiDialogue: 'עצור! אני מכבי, שומר מחוז המרכז. שמעתי שגולם הבמבה עושה צרות בסביבה. היה מוכן לקרב!',
    jarBroken: 'שברת כד עתיק ומצאת כמה שקלים!',
    oasisHeal: 'שתית ממימי נווה המדבר. הבריאות והמאנה שוחזרו במלואם.'
  }
};
