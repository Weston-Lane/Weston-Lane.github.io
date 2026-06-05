# Portfolio Site Specification

## 1. High-Level Objective
Build a purely static, purely frontend portfolio website hosted on GitHub Pages. The site uses a **Data-Driven Architecture** to separate content from layout. It must be highly extensible so adding, removing, or updating projects only requires modifying a single JSON file.

## 2. Tech Stack
- **Build Tool:** Vite
- **Framework:** Vanilla HTML, CSS, and JavaScript (No React, Vue, etc.)
- **Hosting:** GitHub Pages (Output must be purely static HTML/CSS/JS)
- **Data Storage:** A single local JSON file (`src/data/projects.json`)

## 3. Core Features & Requirements

### 3.1 Data-Driven Content
- All project data must live in `src/data/projects.json`.
- The data structure for each project should include: `id`, `title`, `categories` (array of strings), `mediaUrl` (path to image or video), `isVideo` (boolean), `groupSize`, `contributions`, and `summary`.

### 3.2 Tailored Independent Pages
- The build must output multiple isolated HTML entry points (e.g., `index.html`, `gamedev.html`, `techart.html`, `swe.html`).
- **Crucial:** These pages must NOT link to one another. They exist so I can send tailored URLs to different recruiters.
- Every page shares the exact same CSS and JS. The only difference is an attribute in the HTML (e.g., `<main data-category="gamedev">`) that tells the JS which category to filter from the JSON file.

### 3.3 UX & Layout
- **Infinite Vertical Scroll:** The page is a single column of projects. Users scroll down to see more.
- **Project Cards:** Each project is a large card.
- **Media:** Cards must support both images and looping, muted `<video>` tags for thumbnails.
- **Interactive Dropdowns (Accordions):** Beside or below the media (depending on screen size), there must be interactive, expandable sections to reveal:
  1. Group Size
  2. My Contributions (What I worked on)
  3. Brief Summary
- **Mobile First:** The layout must be fully responsive. On desktop, media and dropdowns can be side-by-side. On mobile, they must stack cleanly.

## 4. Implementation Steps for Claude

Claude, please execute this build in the following sequence:

**Phase 1: Scaffolding**
1. Set up the Vite configuration (`vite.config.js`) to support multiple HTML entry points (`main`, `gamedev`, `techart`, `swe`).
2. Create the directory structure (`src/css`, `src/js`, `src/data`, `assets/`).
3. Generate a sample `projects.json` with 3-4 dummy projects spanning different categories.

**Phase 2: HTML & Data Binding**
1. Create the base `index.html` and duplicate it for the specific categories, ensuring the `data-category` attribute is set correctly on each.
2. Write the Vanilla JS script (`src/js/main.js`) to fetch/import `projects.json`, filter the array based on the current page's `data-category`, and dynamically generate the DOM elements.

**Phase 3: Styling & Interactivity**
1. Write the CSS to style the vertical scrolling layout and project cards.
2. Implement the accordion/dropdown logic in JS and CSS for the details sections (Group Size, Contributions, Summary).
3. Ensure media queries gracefully handle mobile screens.

**Phase 4: Verification**
- Run `npm run build` to ensure Vite successfully generates the separate static HTML pages in the `dist/` folder and that assets are linked correctly.

## 5. Constraints
- Do NOT introduce any UI frameworks (no React, no Tailwind unless configured as raw CSS). Write clean, standard CSS/JS.
- Ensure the JavaScript fails gracefully if `projects.json` is missing or malformed.
- The UI must look modern, dark-themed, and professional out of the box.