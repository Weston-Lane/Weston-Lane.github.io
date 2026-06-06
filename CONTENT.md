# Content Guide — editing the site

All site content lives in **two JSON files**. Edit them, save, and the dev server refreshes (or run `npm run build` to publish). You never need to touch HTML/JS/CSS for normal content updates.

- **`src/data/site.json`** — who you are: name, role, bio, photo, contact links, the category pages.
- **`src/data/projects.json`** — the list of projects/games shown on the category pages.

A field marked **optional** can be left out entirely — the site hides anything that's missing (no broken layout, no empty boxes).

---

## `src/data/site.json`

| Field | Type | Required? | What it does |
|-------|------|-----------|--------------|
| `name` | string | **required** | Your name. Shown in the header on every page and as the big heading on the index/about pages. |
| `role` | string | optional | Small subtitle under your name in the header (e.g. job titles). |
| `tagline` | string | optional | One-line hook shown under your name on the index/about pages. |
| `marquee` | string | optional | The scrolling text strip in the banner. Keep it one line; end with a few spaces for a gap before it loops. Omit to hide the marquee. |
| `photo` | string | optional | Path to your portrait image (e.g. `/media/portrait.svg`). Floats beside your bio; text wraps around it. Omit to hide the photo. |
| `about` | array of strings | optional | Your bio. **Each string is its own paragraph.** Shown on the index/about pages. |
| `contacts` | array of objects | optional | The contact buttons in the header + about page. See below. |
| `categories` | object | **required** | Defines your category pages (gamedev / techart / swe). See below. |

### `contacts` — each item

| Field | Type | Required? | What it does |
|-------|------|-----------|--------------|
| `label` | string | **required** | Button text (e.g. `"Email"`, `"GitHub"`). |
| `href` | string | **required** | Where it links. Use `mailto:you@example.com` for email (no space after the colon), or a full `https://…` URL. **Always include `https://`** — a bare `www.…` link will break. |
| `icon` | string | optional | Which icon to show. Must be one of the available icon names (below). Omit for a text-only button. |

**Available `icon` names:** `mail`, `github`, `linkedin`, `itch`, `play`, `code`.
(To add a new one — e.g. Discord — paste an SVG `<symbol id="icon-discord">` into `public/icons.svg`, then use `"icon": "discord"`.)

### `categories` — the category pages

An object keyed by the page id. The three keys (`gamedev`, `techart`, `swe`) correspond to `gamedev.html`, `techart.html`, `swe.html`.

```json
"categories": {
  "gamedev": {
    "title": "Game Development",
    "navLabel": "Game Dev",
    "blurb": "Gameplay systems, prototypes, and shipped titles."
  }
}
```

| Field | Type | Required? | What it does |
|-------|------|-----------|--------------|
| `title` | string | **required** | Big heading at the top of that category page. |
| `navLabel` | string | optional | Short label used in the index page's nav bar. Falls back to `title` if omitted. |
| `blurb` | string | optional | One line under the category title. |

> Adding a *brand-new* category page (a 4th one) needs a small one-time setup beyond JSON — ask and it's a 2-minute change.

---

## `src/data/projects.json`

A list (`[ … ]`) of project objects. Each project appears on the category page(s) listed in its `categories`.

| Field | Type | Required? | What it does |
|-------|------|-----------|--------------|
| `id` | string | **required** | Unique slug for the project (e.g. `"polarize"`). Internal id; not shown. |
| `title` | string | **required** | The card's heading. |
| `categories` | array of strings | **required** | Which page(s) it shows on. Must match `categories` keys: `"gamedev"`, `"techart"`, `"swe"`. **Can list more than one** to show the same project on multiple pages, e.g. `["gamedev", "techart"]`. |
| `mediaUrl` | string | **required** | The card's thumbnail. Can be an **image** path (`/media/x.svg`), a **YouTube link**, a **GIF**, or a **local video** file. See "How media works" below. |
| `gallery` | array of strings | optional | Extra image paths. When present, the media becomes a **carousel**: `mediaUrl` is shown first, then each gallery image, with ‹ › arrows + a counter (click the image to advance too). Wraps around. Use image paths (screenshots). |
| `isVideo` | boolean | optional | Set `true` only for a **local video file** (`.mp4` etc.). Not needed for YouTube — that's auto-detected. Defaults to `false`. |
| `posterUrl` | string | optional | A still image shown before a video/YouTube plays. For YouTube it falls back to YouTube's own thumbnail if omitted. |
| `linkUrl` | string | optional | Makes the **thumbnail itself clickable** (opens this URL, greys out on hover). Skipped for YouTube cards (those play on click). |
| `playUrl` | string | optional | Adds a solid **"▶ Play"** button (link to the hosted/playable build, e.g. its itch.io page). |
| `codeUrl` | string | optional | Adds an outlined **"</> Code"** button (link to the source repo). |
| `groupSize` | string | optional | Fills the **"Group Size"** dropdown. Hidden if omitted. |
| `contributions` | string | optional | Fills the **"My Contributions"** dropdown. Hidden if omitted. |
| `summary` | string | optional | Fills the **"Summary"** dropdown. Hidden if omitted. |

> The three dropdowns (`groupSize`, `contributions`, `summary`) each appear **only** if you provide them. A project with none of them just shows a clean card with no dropdowns.

### How `mediaUrl` works (priority order)

1. **YouTube link** (e.g. `https://www.youtube.com/watch?v=…`, `youtu.be/…`, or an embed URL) → shows a poster with a play button; loads the video on click. Auto-detected, so `isVideo` doesn't matter here. Add **`?start=30`** (seconds) or **`?t=1m30s`** to begin at a set time.
2. **`.gif` link** → **plays only on hover.** It shows a frozen first frame by default and animates when you hover (or keyboard-focus) the card. Auto-detected from the `.gif` extension; `isVideo` is ignored.
3. **`isVideo: true`** → treated as a local, muted, looping video file.
4. **Anything else** → treated as an image.

`linkUrl`, `playUrl`, and `codeUrl` are all independent of `mediaUrl` — a card can have a playable trailer *and* Play/Code buttons.

---

## Minimal examples

**Smallest valid project** (image + nothing else):
```json
{
  "id": "my-game",
  "title": "My Game",
  "categories": ["gamedev"],
  "mediaUrl": "/media/my-game.svg"
}
```

**Fully loaded project:**
```json
{
  "id": "polarize",
  "title": "Polarize",
  "categories": ["gamedev"],
  "mediaUrl": "/media/polarize.svg",
  "isVideo": false,
  "posterUrl": "/media/polarize.svg",
  "linkUrl": "https://sparefireboy.itch.io/polarized",
  "playUrl": "https://sparefireboy.itch.io/polarized",
  "codeUrl": "https://github.com/Weston-Lane/polarize",
  "groupSize": "Team of 4.",
  "contributions": "Designed the magnet physics and level flow.",
  "summary": "RU Game Jam 2026 winner — a puzzle game about magnets."
}
```

---

## Where images live
Put thumbnails/photos in **`public/media/`** and reference them as `/media/filename.ext`. Anything in `public/` is served as-is. Common formats: `.svg`, `.png`, `.jpg`, `.gif`, `.webp`, `.mp4`.

## Gotchas
- It's **JSON**, so: double-quotes only, commas between items, **no trailing comma** after the last item, no comments. If the site goes blank after an edit, a stray comma or missing quote is the usual cause — the browser console will point at it.
- Email links: `"mailto:you@example.com"` with **no space** after `mailto:`.
- External links need the full `https://` prefix.
