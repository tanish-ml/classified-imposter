import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FolderPlus,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  decodeDeckShareCode,
  encodeDeckShareCode,
  generateSmartCustomDeck,
} from '../data/categories';
import { CategoryDeck, WordEntry } from '../types/game';
import { spyAudio } from '../utils/soundEffects';

interface CustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  customDecks: CategoryDeck[];
  onSaveCustomDecks: (decks: CategoryDeck[], newlyCreatedId?: string) => void;
}

export const CustomDeckModal: React.FC<CustomDeckModalProps> = ({
  isOpen,
  onClose,
  customDecks,
  onSaveCustomDecks,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'import'>('create');
  const [deckName, setDeckName] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [smartKeywords, setSmartKeywords] = useState('');
  const [entries, setEntries] = useState<WordEntry[]>([
    { word: '', hint: '', decoy: '' },
    { word: '', hint: '', decoy: '' },
    { word: '', hint: '', decoy: '' },
    { word: '', hint: '', decoy: '' },
    { word: '', hint: '', decoy: '' },
  ]);
  const [importCode, setImportCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 3200);
  };

  const handleSmartPopulate = () => {
    spyAudio.playStamp();
    const generated = generateSmartCustomDeck(
      deckName || 'Custom Operation',
      smartKeywords
    );
    if (!deckName.trim()) {
      setDeckName(generated.name);
    }
    if (!deckDesc.trim()) {
      setDeckDesc(generated.description);
    }
    setEntries(generated.words);
    showBanner(`Synthesized ${generated.words.length} targets with hints & decoys!`);
  };

  const handleEntryChange = (
    idx: number,
    field: keyof WordEntry,
    value: string
  ) => {
    setEntries((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    spyAudio.playTick();
    setEntries((prev) => [...prev, { word: '', hint: '', decoy: '' }]);
  };

  const handleRemoveRow = (idx: number) => {
    spyAudio.playTick();
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveNewDeck = () => {
    const validWords = entries
      .filter((e) => e.word.trim().length > 0)
      .map((e, i, arr) => ({
        word: e.word.trim(),
        hint: e.hint.trim() || `${deckName || 'Custom'} Clue`,
        decoy:
          e.decoy.trim() ||
          arr[(i + 1) % arr.length]?.word.trim() ||
          `${e.word.trim()} Alt`,
      }));

    if (validWords.length < 3) {
      showBanner('Please include at least 3 words (or click Auto-Generate!).');
      return;
    }

    const cleanName = deckName.trim() || `Custom Pack #${customDecks.length + 1}`;
    const newDeck: CategoryDeck = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      codename: `CUSTOM // ${cleanName.slice(0, 12).toUpperCase()}`,
      icon: 'FolderLock',
      tier: 'classified',
      description:
        deckDesc.trim() || `User-created dossier with ${validWords.length} targets.`,
      isCustom: true,
      words: validWords,
    };

    spyAudio.playStamp();
    onSaveCustomDecks([newDeck, ...customDecks], newDeck.id);
    setDeckName('');
    setDeckDesc('');
    setSmartKeywords('');
    setEntries([
      { word: '', hint: '', decoy: '' },
      { word: '', hint: '', decoy: '' },
      { word: '', hint: '', decoy: '' },
    ]);
    setActiveTab('manage');
    showBanner(`Saved & selected "${newDeck.name}"!`);
  };

  const handleCopyShareCode = (deck: CategoryDeck) => {
    const code = encodeDeckShareCode(deck);
    navigator.clipboard?.writeText(code).catch(() => {});
    spyAudio.playTick();
    setCopiedId(deck.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImportDeck = () => {
    const decoded = decodeDeckShareCode(importCode);
    if (!decoded) {
      showBanner('Invalid Share Code! Make sure it starts with DOSSIER1:...');
      return;
    }
    spyAudio.playStamp();
    onSaveCustomDecks([decoded, ...customDecks], decoded.id);
    setImportCode('');
    setActiveTab('manage');
    showBanner(`Imported "${decoded.name}" (${decoded.words.length} words)!`);
  };

  const handleDeleteDeck = (id: string) => {
    spyAudio.playTick();
    onSaveCustomDecks(customDecks.filter((d) => d.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-noir-900 shadow-dossier">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-noir-950 px-5 py-4">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-tactical">
              UNLIMITED CUSTOM PACKS // ALL UNLOCKED
            </span>
            <h2 className="font-display text-xl font-bold text-white">
              CUSTOM DOSSIER STUDIO
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              onClose();
            }}
            className="rounded-lg border border-zinc-800 bg-noir-800 p-2 text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-noir-950/60 px-5 pt-2">
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              setActiveTab('create');
            }}
            className={`border-b-2 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'create'
                ? 'border-amber-tactical text-amber-tactical'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            + Create / Smart Generate
          </button>
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              setActiveTab('manage');
            }}
            className={`border-b-2 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'manage'
                ? 'border-amber-tactical text-amber-tactical'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            My Custom Decks ({customDecks.length})
          </button>
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              setActiveTab('import');
            }}
            className={`border-b-2 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'import'
                ? 'border-amber-tactical text-amber-tactical'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Import Share Code
          </button>
        </div>

        {statusBanner && (
          <div className="border-b border-emerald-500/30 bg-emerald-950/50 px-5 py-2 font-mono text-xs text-emerald-300">
            ✓ {statusBanner}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {activeTab === 'create' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[11px] uppercase text-zinc-400">
                    Dossier Title *
                  </label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="e.g., Friend Group Lore, 90s Hip-Hop..."
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-noir-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase text-zinc-400">
                    Briefing Description
                  </label>
                  <input
                    type="text"
                    value={deckDesc}
                    onChange={(e) => setDeckDesc(e.target.value)}
                    placeholder="Inside jokes & secret missions..."
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-noir-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
                  />
                </div>
              </div>

              {/* Smart Generator Box */}
              <div className="rounded-xl border border-amber-tactical/40 bg-amber-950/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-amber-tactical">
                      <Sparkles className="h-4 w-4" />
                      SMART DOSSIER SYNTHESIZER
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Paste comma-separated words/names (or just a theme title) and auto-populate hints & undercover decoys!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSmartPopulate}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-tactical px-3.5 py-2 font-mono text-xs font-bold uppercase text-noir-950 shadow-amber-glow transition hover:bg-amber-glow"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-Generate Pack
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={smartKeywords}
                  onChange={(e) => setSmartKeywords(e.target.value)}
                  placeholder="Optional: Paste words separated by commas (e.g., Vegas Trip, Dave's Honda, Late Night Tacos, Karaoke Incident...)"
                  className="mt-3 w-full rounded-lg border border-zinc-700/80 bg-noir-950/90 p-2.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
                />
              </div>

              {/* Word List Table */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-zinc-300">
                    Target Word List ({entries.filter((e) => e.word.trim()).length} Valid)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-noir-800 px-2.5 py-1 font-mono text-xs text-zinc-200 hover:border-amber-tactical"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Word
                  </button>
                </div>

                <div className="space-y-2">
                  {entries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-800 bg-noir-950/60 p-2.5 sm:grid-cols-12"
                    >
                      <input
                        type="text"
                        value={entry.word}
                        onChange={(e) =>
                          handleEntryChange(idx, 'word', e.target.value)
                        }
                        placeholder={`#${idx + 1} Secret Word *`}
                        className="rounded-lg border border-zinc-800 bg-noir-900 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-tactical focus:outline-none sm:col-span-4"
                      />
                      <input
                        type="text"
                        value={entry.hint}
                        onChange={(e) =>
                          handleEntryChange(idx, 'hint', e.target.value)
                        }
                        placeholder="Imposter Hint (Optional)"
                        className="rounded-lg border border-zinc-800 bg-noir-900 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-amber-tactical focus:outline-none sm:col-span-4"
                      />
                      <div className="flex gap-1.5 sm:col-span-4">
                        <input
                          type="text"
                          value={entry.decoy}
                          onChange={(e) =>
                            handleEntryChange(idx, 'decoy', e.target.value)
                          }
                          placeholder="Decoy Word (Optional)"
                          className="w-full rounded-lg border border-zinc-800 bg-noir-900 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
                        />
                        {entries.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="rounded-lg border border-zinc-800 bg-noir-900 px-2 text-zinc-500 hover:border-crimson/50 hover:text-crimson-glow"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-3">
              {customDecks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
                  <FolderPlus className="mx-auto h-10 w-10 text-zinc-600" />
                  <p className="mt-2 font-display text-base font-bold text-zinc-300">
                    No Custom Dossiers Yet
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Create your own word pack or use the Smart Synthesizer to build one in seconds.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="mt-4 rounded-xl bg-amber-tactical px-4 py-2 font-mono text-xs font-bold uppercase text-noir-950"
                  >
                    Create First Pack
                  </button>
                </div>
              ) : (
                customDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-noir-950 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-tactical/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-tactical">
                          CUSTOM DOSSIER
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          {deck.words.length} Words
                        </span>
                      </div>
                      <h4 className="mt-1 font-display text-base font-bold text-white">
                        {deck.name}
                      </h4>
                      <p className="text-xs text-zinc-400">{deck.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyShareCode(deck)}
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-noir-800 px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-amber-tactical"
                      >
                        {copiedId === deck.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied Code!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Share Code</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="rounded-lg border border-crimson/30 bg-crimson/10 p-2 text-crimson-glow hover:bg-crimson/20"
                        title="Delete Custom Deck"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-noir-950 p-4">
              <h3 className="font-display text-base font-bold text-white">
                Import a Friend’s Dossier Share Code
              </h3>
              <p className="text-xs text-zinc-400">
                Paste a <code className="text-amber-tactical">DOSSIER1:...</code> code shared by another player to unlock their custom pack instantly on your device.
              </p>
              <textarea
                rows={4}
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="DOSSIER1:eyJuIjoi..."
                className="w-full rounded-xl border border-zinc-700 bg-noir-900 p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
              />
              <button
                type="button"
                onClick={handleImportDeck}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-mono text-xs font-bold uppercase text-white hover:bg-emerald-500"
              >
                <Upload className="h-4 w-4" />
                Decrypt & Import Dossier
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-noir-950 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-4 py-2 font-mono text-xs text-zinc-300 hover:bg-noir-800"
          >
            Close
          </button>
          {activeTab === 'create' && (
            <button
              type="button"
              onClick={handleSaveNewDeck}
              className="rounded-xl bg-crimson px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-crimson-glow hover:bg-crimson-glow"
            >
              Save & Equip Dossier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
