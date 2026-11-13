# CLASSIFIED // IMPOSTER — Free-to-Play Web & Mobile Party Game

A 100% free-to-play, zero-paywall social deduction word game built for mobile and web browsers (PWA), replicating and upgrading every premium feature of the viral iOS/Android **Imposter** party game with a **Minimalist Spy / Classified Dossier** aesthetic.

---

## Key Features (100% Unlocked)

- **Dual Multiplayer Modes:**
  - **Single-Device Pass & Play:** Hand one phone around the room (3 to 20 players) with a **Biometric Fingerprint Hold-to-Unredact** privacy shield so neighboring players can never accidentally peek at your screen.
  - **Multi-Device Live Room (QR Code & 6-Digit Room Code):** Host a live room (`SPY-XXXX`) powered by hybrid **WebRTC P2P (`PeerJS`)** + **`BroadcastChannel`**, allowing players to scan a QR code and receive their secret dossier on their own phones with zero server fees.
- **32+ Unlocked Categories & 1,600+ Curated Target Triples:**
  - Every word entry includes `{ word, hint, decoy }`.
  - **Level 1 (Standard Clearance):** Food & Beverages, Animals & Wildlife, Everyday Objects, Places & Landmarks, Jobs & Professions, Clothing & Disguises, Safe House & Home, Vehicles & Extraction.
  - **Level 2 (Media & Pop Culture):** Movies & Cinema, TV Shows & Series, Video Games, Anime & Manga, Celebrities & Icons, Superheroes & Villains, Music & Instruments, Cartoons & Nostalgia.
  - **Level 3 (Modern Syndicates):** Gen-Z & Internet Slang, World Brands, Fast Food & Chains, Social Media & Tech, Sports & Arenas, Cars & Supercars, College & Campus Life, Billionaire Vault.
  - **Level 4 (Classified & After Dark):** Spicy // After Dark (18+), Dating & Red Flags, Black Ops & Heists, Unsolved & Conspiracies, Historical Figures, Mythology & Fantasy, Orbital & Lab Intel, Coded Idioms & Phrases.
- **Upgraded Roles & Game Modifiers:**
  - **Imposter Intel Hints:** Toggle between *Subtle Clue*, *First Letter + Length*, *Both*, or *No Hint (Hardcore)*.
  - **Undercover (Decoy Mode):** An agent receives a closely related decoy word without knowing if they hold the true word or the decoy!
  - **The Jester (Double Agent):** Knows the secret word, but wins *solo* (`+300 PTS`) if they trick the group into voting them out.
  - **The Detective (Director):** Can perform 1 private clearance scan during the Tribunal.
  - **The Accomplice (The Mole):** Knows both the secret word and the Imposter's identity.
- **Chaos & Troll Protocols:**
  - **Troll Mode (All Imposters):** *Everyone* is secretly an Imposter with only a clue—nobody knows the real word!
  - **Paranoia Mode (Zero Imposters):** *Everyone* is a Cleared Civilian with the same word.
  - **Mystery Count & Russian Roulette (Random Chaos):** Keeps the room guessing every round.
- **Custom Dossier Studio & Smart Synthesizer:**
  - Create unlimited custom decks, auto-generate playable packs from keywords/inside jokes, and share/import decks via `DOSSIER1:...` share codes.
- **Imposter's Last-Chance Word Steal:**
  - When caught at the Tribunal, the Imposter gets 20 seconds to deduce the secret word from a 6-Word Tactical Lineup (or type it directly) to hijack the victory!

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (accessible on LAN & localhost:5173)
npm run dev

# Run automated unit & game engine test suite
npm run test

# Build optimized production bundle
npm run build
```
