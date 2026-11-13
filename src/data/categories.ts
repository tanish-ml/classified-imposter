import { CategoryDeck, ClearanceTier, WordEntry } from '../types/game';
import { CLASSIC_PACKS } from './packs/classicPacks';
import { MEDIA_PACKS } from './packs/mediaPacks';
import { LIFESTYLE_PACKS } from './packs/lifestylePacks';
import { CLASSIFIED_PACKS } from './packs/classifiedPacks';

export const BUILTIN_CATEGORIES: CategoryDeck[] = [
  ...CLASSIC_PACKS,
  ...MEDIA_PACKS,
  ...LIFESTYLE_PACKS,
  ...CLASSIFIED_PACKS,
];

export const CLEARANCE_TIER_META: Record<
  ClearanceTier,
  { label: string; badge: string; description: string; accentClass: string }
> = {
  standard: {
    label: 'LEVEL 1 // STANDARD CLEARANCE',
    badge: 'LVL-01',
    description: 'Essential field operations: food, animals, places, jobs, and everyday gear.',
    accentClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
  },
  pop_culture: {
    label: 'LEVEL 2 // MEDIA & POP CULTURE',
    badge: 'LVL-02',
    description: 'Cinema, TV series, gaming, anime, superheroes, celebrities, and nostalgia.',
    accentClass: 'text-amber-tactical border-amber-tactical/40 bg-amber-950/30',
  },
  lifestyle: {
    label: 'LEVEL 3 // MODERN SYNDICATES',
    badge: 'LVL-03',
    description: 'Gen-Z brainrot, world brands, fast food chains, tech, sports, cars & luxury.',
    accentClass: 'text-sky-400 border-sky-500/40 bg-sky-950/30',
  },
  classified: {
    label: 'LEVEL 4 // BLACK OPS & AFTER DARK',
    badge: 'EYES ONLY',
    description: 'Spicy 18+, dating red flags, heists, conspiracies, history, arcane & cosmos.',
    accentClass: 'text-crimson-glow border-crimson/50 bg-crimson-dark/25',
  },
};

const CUSTOM_DECKS_STORAGE_KEY = 'classified_imposter_custom_decks_v1';

export function loadCustomDecks(): CategoryDeck[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DECKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveCustomDecks(decks: CategoryDeck[]): void {
  try {
    localStorage.setItem(CUSTOM_DECKS_STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // Ignore storage quota errors
  }
}

export function getAllCategories(customDecks: CategoryDeck[] = []): CategoryDeck[] {
  return [...customDecks, ...BUILTIN_CATEGORIES];
}

export function encodeDeckShareCode(deck: CategoryDeck): string {
  const compact = {
    n: deck.name,
    d: deck.description,
    s: deck.isSpicy ? 1 : 0,
    w: deck.words.map((item) => [item.word, item.hint, item.decoy]),
  };
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return 'DOSSIER1:' + btoa(binary);
}

export function decodeDeckShareCode(code: string): CategoryDeck | null {
  try {
    const trimmed = code.trim();
    const rawBase64 = trimmed.startsWith('DOSSIER1:')
      ? trimmed.slice('DOSSIER1:'.length)
      : trimmed;
    const binary = atob(rawBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed.n !== 'string' || !Array.isArray(parsed.w)) {
      return null;
    }
    const words: WordEntry[] = parsed.w
      .filter((row: any) => Array.isArray(row) && row[0])
      .map((row: any) => ({
        word: String(row[0]).trim(),
        hint: String(row[1] || 'Classified Clue').trim(),
        decoy: String(row[2] || String(row[0]) + ' Variant').trim(),
      }));
    if (words.length < 3) return null;
    return {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: parsed.n.slice(0, 48),
      codename: `CUSTOM // ${parsed.n.slice(0, 12).toUpperCase()}`,
      icon: 'FolderLock',
      tier: 'classified',
      description: parsed.d || 'Imported custom agent dossier.',
      isCustom: true,
      isSpicy: Boolean(parsed.s),
      words,
    };
  } catch {
    return null;
  }
}

/**
 * Smart Theme & Inside-Joke Deck Generator:
 * Generates a rich 20-word playable deck from a theme keyword or comma-separated list of topics.
 */
export function generateSmartCustomDeck(
  themeTitle: string,
  seedKeywordsRaw: string
): CategoryDeck {
  const cleanTitle = themeTitle.trim() || 'Special Operation';
  const rawKeywords = seedKeywordsRaw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // If the user provided specific keywords/inside jokes, enrich each with smart hints & decoys
  const generatedWords: WordEntry[] = [];

  const tacticalDescriptors = [
    'Signature Move',
    'Late Night Incident',
    'Classified Rumor',
    'Famous Quote',
    'Secret Weakness',
    'Legendary Moment',
    'Weekend Habit',
    'Unspoken Rule',
    'Hidden Stash',
    'Guilty Pleasure',
    'Emergency Backup',
    'Undercover Alias',
  ];

  for (let i = 0; i < rawKeywords.length; i++) {
    const item = rawKeywords[i];
    // Support "Word | Hint | Decoy" syntax if user typed pipes
    if (item.includes('|')) {
      const parts = item.split('|').map((p) => p.trim());
      generatedWords.push({
        word: parts[0],
        hint: parts[1] || `${cleanTitle} Intel`,
        decoy: parts[2] || rawKeywords[(i + 1) % rawKeywords.length] || `${parts[0]} Prime`,
      });
    } else {
      const nextKeyword =
        rawKeywords.length > 1
          ? rawKeywords[(i + 1) % rawKeywords.length]
          : `${item} 2.0`;
      const descriptor = tacticalDescriptors[i % tacticalDescriptors.length];
      generatedWords.push({
        word: item,
        hint: `${cleanTitle} // ${descriptor}`,
        decoy: nextKeyword === item ? `${item} Deluxe` : nextKeyword,
      });
    }
  }

  // If fewer than 12 words were entered, pull matching words from built-in packs or synthesize themed entries
  if (generatedWords.length < 12) {
    const lowerTheme = (cleanTitle + ' ' + seedKeywordsRaw).toLowerCase();
    const matchedFromBuiltins: WordEntry[] = [];

    for (const pack of BUILTIN_CATEGORIES) {
      if (
        pack.name.toLowerCase().includes(lowerTheme) ||
        pack.description.toLowerCase().includes(lowerTheme)
      ) {
        matchedFromBuiltins.push(...pack.words.slice(0, 15));
      } else {
        for (const w of pack.words) {
          if (
            w.word.toLowerCase().includes(lowerTheme) ||
            w.hint.toLowerCase().includes(lowerTheme)
          ) {
            matchedFromBuiltins.push(w);
          }
        }
      }
    }

    for (const m of matchedFromBuiltins) {
      if (generatedWords.length >= 20) break;
      if (!generatedWords.some((g) => g.word.toLowerCase() === m.word.toLowerCase())) {
        generatedWords.push(m);
      }
    }

    const fallbackTemplates = [
      { suffix: 'Headquarters', hint: 'Main Base Of Operations', decoy: 'Safe House' },
      { suffix: 'VIP Lounge', hint: 'Members Only Access', decoy: 'Backstage Room' },
      { suffix: 'Secret Menu', hint: 'Off-The-Record Order', decoy: 'Chef’s Special' },
      { suffix: 'Final Boss', hint: 'Ultimate Challenge', decoy: 'Arch-Nemesis' },
      { suffix: 'Group Chat', hint: 'Leaked Screenshots', decoy: 'Private Story' },
      { suffix: 'Starter Pack', hint: 'Essential Stereotype Kit', decoy: 'Survival Guide' },
      { suffix: 'Afterparty', hint: '2AM Chaos Location', decoy: 'Pre-Game' },
      { suffix: 'Plot Twist', hint: 'Nobody Saw It Coming', decoy: 'Cliffhanger' },
      { suffix: 'Hall of Fame', hint: 'All-Time Greatest', decoy: 'Wall of Shame' },
      { suffix: 'Cover Story', hint: 'Convenient Excuse', decoy: 'Alibi' },
      { suffix: 'Red Flag', hint: 'Immediate Warning Sign', decoy: 'Dealbreaker' },
      { suffix: 'Origin Story', hint: 'How It All Started', decoy: 'Flashback' },
    ];

    let idx = 0;
    while (generatedWords.length < 15 && idx < fallbackTemplates.length) {
      const tpl = fallbackTemplates[idx++];
      generatedWords.push({
        word: `${cleanTitle} ${tpl.suffix}`,
        hint: tpl.hint,
        decoy: `${cleanTitle} ${tpl.decoy}`,
      });
    }
  }

  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleanTitle,
    codename: `CUSTOM // ${cleanTitle.slice(0, 12).toUpperCase()}`,
    icon: 'Sparkles',
    tier: 'classified',
    description: `Custom tactical deck generated for "${cleanTitle}" (${generatedWords.length} targets).`,
    isCustom: true,
    words: generatedWords,
  };
}
