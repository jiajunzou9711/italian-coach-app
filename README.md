# Coach Italiano — PWA

Free listening/speaking practice app for iPhone, companion to the chat-based
Italian training system in `../italian`. Static site, no server: TTS and
speech recognition run on-device in iOS Safari.

Design spec: `../italian/docs/superpowers/specs/2026-06-10-italian-coach-app-design.md`

## How it works

- The chat session (Claude Code in `../italian`) generates `packs/YYYY-MM-DD.json`
  after each formal training session and pushes it here.
- This app (GitHub Pages) loads the latest pack and runs four modes:
  Ascolto (listening), Dettato (dictation), Parlato (speaking), Shadowing.
- Practice results are committed back to `results/YYYY-MM-DD.json` via the
  GitHub contents API; the next chat session reads them.

## Daily pack format

See `js/pack-schema.js` for the authoritative validation. Shape:

```json
{
  "date": "YYYY-MM-DD",
  "focus": "one-line description of the day's target",
  "dialogue": {
    "title": "...",
    "lines": [{ "speaker": "A", "it": "...", "zh": "..." }],
    "questions": [{ "q": "...", "options": ["...", "..."], "answer": 0 }]
  },
  "dictation": [{ "it": "...", "hint": "optional zh hint" }],
  "speaking": [{ "prompt_zh": "...", "accepted": ["...", "..."], "target_point": "..." }],
  "shadowing": [{ "it": "..." }],
  "vocab": [{ "it": "...", "zh": "..." }]
}
```

Pack content rules (enforced by the session protocol, not the app):
only grammar already introduced in formal sessions; recycle error-log items
and Yellow dashboard rows; new words go in `vocab`.

Adding a pack:

```bash
node scripts/validate-pack.mjs packs/YYYY-MM-DD.json   # must print OK
# add the date to packs/index.json "dates"
git add packs/ && git commit -m "Add daily pack YYYY-MM-DD" && git push
```

## Phone setup (one time)

1. iPhone Settings → Accessibility → Spoken Content → Voices → Italian:
   download an enhanced voice (e.g. **Alice (Enhanced)**) for better TTS.
2. Open the GitHub Pages URL in Safari.
3. Share button → **Add to Home Screen**.
4. Open the app from the home screen; allow microphone and speech
   recognition when prompted (first use of Parlato/Shadowing).

## Results sync (one time)

1. GitHub → Settings → Developer settings → Fine-grained personal access
   tokens → Generate new token. Repository access: **only this repo**.
   Permissions: **Contents: Read and write**. Pick a long expiration.
2. In the app: ⚙️ Impostazioni → fill owner / repo / token → Salva.
3. Results now upload automatically on app open, or via
   "Sincronizza risultati". Offline results wait in localStorage.

## Development

```bash
npm test                                   # unit tests (node --test)
python3 -m http.server 8765                # serve locally
node scripts/make-icon.mjs                 # regenerate icons
```
