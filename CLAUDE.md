# WeebTrax — Project Roadmap

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Local media organization | 🔄 In Progress |
| 2 | JSON metadata | ⬜ Not started |
| 3 | Website reads JSON | ⬜ Not started |
| 4 | Create backend / API (FastAPI) | ⬜ Not started |
| 5 | Move JSON metadata into PostgreSQL | ⬜ Not started |
| 6 | Deploy with Railway | ⬜ Not started |
| 7 | Move large media to storage bucket (Cloudflare R2) | ⬜ Not started |

---

## Phase 1 — Local media organization

Target folder structure:
```
public/assets/
  mixes/
    audio/          ← .mp3 files, slugified names
    thumbnails/     ← matching .jpg per mix
  scenes/
    videos/         ← .mp4 clips, slugified names
    thumbnails/     ← matching .jpg per scene
  metadata/
    mixes.json
    scenes.json
```

### Checklist
- [x] Slugify MP3 filenames on flash drive (Mixes folders)
- [x] Slugify WAV filenames in Mastered folder
- [ ] Organize mix audio files into `public/assets/mixes/audio/`
- [ ] Organize mix thumbnails into `public/assets/mixes/thumbnails/`
- [ ] Organize scene MP4 clips into `public/assets/scenes/videos/`
- [x] Organize scene thumbnails into `public/assets/scenes/thumbnails/`

---

## Phase 2 — JSON metadata

Create:
- `public/assets/metadata/mixes.json`
- `public/assets/metadata/scenes.json`

Fields per mix: `id`, `title`, `slug`, `artist`, `duration`, `releaseDate`, `mood`, `tags`, `audioPath`, `thumbnailPath`, `youtubeUrl`, `soundcloudUrl`

Fields per scene: `id`, `name`, `slug`, `episodeNumber`, `startTime`, `endTime`, `duration`, `mood`, `tags`, `videoPath`, `thumbnailPath`

---

## Phase 3 — Website reads JSON

Frontend dynamically loads `mixes.json` and `scenes.json` instead of hardcoded HTML.
Generates: archive rows, scene cards, thumbnails, play buttons, YT/SC links, mood tags.

---

## Phase 4 — Backend / API

FastAPI backend with endpoints:
- `GET /api/mixes`
- `GET /api/mixes/latest`
- `GET /api/scenes`
- `GET /api/scenes?page=1`
- `GET /api/scenes?tag=rainy`

Can still read from JSON initially, then swap to PostgreSQL.

---

## Phase 5 — PostgreSQL

JSON fields become table columns. DB stores metadata + file paths only (not files themselves).

---

## Phase 6 — Deploy with Railway

- Frontend → Cloudflare Pages
- Backend/API → Railway
- Database → PostgreSQL on Railway

---

## Phase 7 — Media storage bucket (if needed)

Move large files from repo to Cloudflare R2. DB paths change from `/assets/...` to `https://media.weebtrax.com/...`.
