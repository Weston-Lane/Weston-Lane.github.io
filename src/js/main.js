/**
 * Single shared entry point for every page (index + each category page).
 *
 * Pages never differ in their JS or CSS — only in two HTML hooks:
 *   - <main data-category="..."> tells us which projects to render.
 *   - <main data-page="about">   renders the landing/about page instead.
 *
 * Content lives entirely in the JSON files under src/data, so updating the
 * site means editing data, not markup. We import the JSON as URLs and fetch
 * at runtime so a missing/malformed file degrades gracefully in the browser
 * instead of breaking the whole bundle.
 */

import siteUrl from '../data/site.json?url';
import projectsUrl from '../data/projects.json?url';
import workUrl from '../data/work.json?url';

/** Fetch + parse JSON, returning null (never throwing) on any failure. */
async function loadJson(url, label) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Could not load ${label}:`, err);
    return null;
  }
}

/** Minimal, dependency-free element builder. */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.includes('-') || key === 'role') node.setAttribute(key, value);
    else node[key] = value;
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

/** An <svg><use> reference into the shared /icons.svg sprite. */
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `/icons.svg#icon-${name}`);
  svg.append(use);
  return svg;
}

/** Build the contact link row shared by the header and footer. */
function contactList(contacts, className) {
  const list = el('ul', { class: className });
  for (const c of contacts || []) {
    const link = el(
      'a',
      { href: c.href, rel: 'noopener', 'data-label': c.label },
      c.icon ? icon(c.icon) : null,
      el('span', { text: c.label }),
    );
    if (c.href && c.href.startsWith('http')) link.target = '_blank';
    list.append(el('li', {}, link));
  }
  return list;
}

/** The standalone about/contact page that category pages link to. */
const ABOUT_PAGE = { label: 'About Me', href: '/pages/about.html' };
const WORK_EX = { label: 'Work Exp', href: '/pages/work.html' };

/** One nav link per category, derived from site.json (data-driven). */
function categoryLinks(site) {
  return Object.entries(site?.categories || {}).map(([key, meta]) => ({
    label: meta.navLabel || meta.title || key,
    href: `/pages/${key}.html`,
  }));
}

/** Category page links rendered as buttons (used at the foot of the landing pages). */
function categoryButtons(site) {
  const list = el('ul', { class: 'about-contacts about-cats' });
  for (const link of categoryLinks(site)) {
    list.append(el('li', {}, el('a', { href: link.href, text: link.label })));
  }
  return list;
}

/** Build the banner nav. An empty list renders nothing (leaf pages). */
function navList(links) {
  const list = el('ul', { class: 'site-nav-list' });
  for (const link of links) {
    list.append(
      el('li', {}, el('a', { class: 'site-nav-link', href: link.href, text: link.label })),
    );
  }
  return el('nav', { class: 'site-nav', 'aria-label': 'Pages' }, list);
}

/**
 * Header: identity + (page-dependent) nav + contact links. The name is never a
 * link, so no page can accidentally route back to the master index through it.
 */
function renderHeader(site, navLinks = []) {
  const mount = document.querySelector('[data-site-header]');
  if (!mount || !site) return;

  const identity = el(
    'div',
    { class: 'header-identity' },
    el('p', { class: 'header-name', text: site.name }),
    site.role ? el('p', { class: 'header-role', text: site.role }) : null,
  );

  const actions = el('div', { class: 'header-actions' });
  if (navLinks.length) actions.append(navList(navLinks));
  actions.append(contactList(site.contacts, 'header-contacts'));

  const children = [el('div', { class: 'header-inner' }, identity, actions)];
  // Optional scrolling marquee strip under the header row (decorative chrome).
  if (site.marquee) {
    children.push(el('div', { class: 'header-marquee', text: site.marquee }));
  }
  mount.replaceChildren(...children);
}

function renderFooter(site) {
  const mount = document.querySelector('[data-site-footer]');
  if (!mount || !site) return;
  const year = new Date().getFullYear();
  mount.replaceChildren(
    el('p', { class: 'footer-copy', text: `© ${year} ${site.name}` }),
  );
}

/**
 * Landing (index) / about page. `paragraphs` is the bio text to show — the
 * index page passes site.intro, the about page passes site.about, so the two
 * pages can carry different copy while sharing this layout.
 */
function renderAbout(main, site, paragraphs) {
  if (!site) {
    main.replaceChildren(errorState('This page could not load.'));
    return;
  }
  const intro = el(
    'section',
    { class: 'about' },
    el('p', { class: 'about-eyebrow', text: 'Portfolio' }),
    el('h1', { class: 'about-name', text: site.name }),
    site.tagline ? el('p', { class: 'about-tagline', text: site.tagline }) : null,
  );
  const body = el('div', { class: 'about-body' });
  // The floated photo must precede the paragraphs so the text wraps around it.
  if (site.photo) {
    body.append(
      el('img', {
        class: 'about-photo',
        src: site.photo,
        alt: `Photo of ${site.name}`,
        loading: 'lazy',
        decoding: 'async',
      }),
    );
  }
  for (const para of paragraphs || []) body.append(el('p', { text: para }));
  intro.append(body);
  intro.append(categoryButtons(site));
  main.replaceChildren(intro);
}

/** One work-experience entry (résumé style). */
function renderExperience(job) {
  const item = el('article', { class: 'exp-item' });

  item.append(
    el(
      'div',
      { class: 'exp-head' },
      el('h2', { class: 'exp-role', text: job.role || 'Role' }),
      job.period ? el('span', { class: 'exp-period', text: job.period }) : null,
    ),
  );

  const meta = [job.company, job.location].filter(Boolean).join('  ·  ');
  if (meta) item.append(el('p', { class: 'exp-meta', text: meta }));
  if (job.summary) item.append(el('p', { class: 'exp-summary', text: job.summary }));

  if (Array.isArray(job.highlights) && job.highlights.length) {
    const list = el('ul', { class: 'exp-highlights' });
    for (const point of job.highlights) list.append(el('li', { text: point }));
    item.append(list);
  }
  return item;
}

/**
 * Work-experience page (pages/work.html). Preliminary résumé-style layout: a heading
 * plus a vertical list of roles, all driven by site.json's `experience` array.
 */
function renderWork(main, work) {
  const intro = el(
    'section',
    { class: 'work-intro' },
    el('p', { class: 'about-eyebrow', text: 'Résumé' }),
    el('h1', { class: 'work-title', text: 'Work Experience' }),
  );

  const list = el('section', { class: 'exp-list' });
  if (!Array.isArray(work)) {
    list.append(errorState('Work experience could not be loaded.'));
  } else {
    // A 'role' is required, so entries without one (e.g. the _comment note) are skipped.
    const jobs = work.filter((job) => job && job.role);
    if (jobs.length === 0) list.append(emptyState('No experience listed yet.'));
    else for (const job of jobs) list.append(renderExperience(job));
  }
  main.replaceChildren(intro, list);
}

/** Accordion section (Group Size / Contributions / Summary). */
function accordionItem(label, content) {
  if (!content) return null;
  const panelId = `panel-${Math.random().toString(36).slice(2, 9)}`;
  const trigger = el('button', {
    type: 'button',
    class: 'accordion-trigger',
    'aria-expanded': 'false',
  });
  trigger.setAttribute('aria-controls', panelId);
  trigger.append(el('span', { text: label }), el('span', { class: 'accordion-chevron', 'aria-hidden': 'true' }));

  const panel = el('div', { class: 'accordion-panel', id: panelId, role: 'region' });
  panel.hidden = true;
  panel.append(el('p', { class: 'accordion-content', text: content }));

  return el('div', { class: 'accordion-item' }, trigger, panel);
}

/**
 * Extract an 11-character YouTube video id from any common URL shape:
 *   youtube.com/watch?v=ID · youtu.be/ID · youtube.com/embed|shorts|v/ID
 * Returns null when the URL isn't YouTube, so other media paths run normally.
 */
function youTubeId(url) {
  if (typeof url !== 'string') return null;
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube(?:-nocookie)?\.com\/(?:embed|shorts|v)\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}

/** YouTube's own thumbnail, used when a project has no explicit posterUrl. */
function youTubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Start time (in seconds) from a YouTube URL's `start=` or `t=` param. Accepts
 * plain seconds (`start=30`) or YouTube's `1h2m3s` / `90s` form. Null if absent.
 */
function youTubeStart(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/[?&](?:start|t)=([\w]+)/i);
  if (!match) return null;
  const raw = match[1];
  if (/^\d+$/.test(raw)) return Number(raw);
  let seconds = 0;
  const h = raw.match(/(\d+)h/i);
  const m = raw.match(/(\d+)m/i);
  const s = raw.match(/(\d+)s/i);
  if (h) seconds += Number(h[1]) * 3600;
  if (m) seconds += Number(m[1]) * 60;
  if (s) seconds += Number(s[1]);
  return seconds || null;
}

/**
 * If the project has a `linkUrl`, wrap its media in a clickable anchor (greyed
 * on hover via CSS). Without a linkUrl the media is returned untouched.
 * Not used for YouTube cards — there a click already plays the video.
 */
function mediaLink(project, node) {
  if (!project.linkUrl) return node;
  const link = el(
    'a',
    {
      class: 'card-media-link',
      href: project.linkUrl,
      rel: 'noopener',
      'aria-label': `${project.title} — open link`,
    },
    node,
  );
  if (/^https?:/i.test(project.linkUrl)) link.target = '_blank';
  return link;
}

/** A muted, looping, autoplaying <video> element with an optional poster. */
function videoElement(src, posterUrl, alt) {
  const video = el('video', {
    class: 'card-asset',
    src,
    poster: posterUrl || null,
    muted: true,
    loop: true,
    autoplay: true,
    playsInline: true,
    preload: 'metadata',
    'aria-label': alt || null,
  });
  video.setAttribute('playsinline', '');
  return video;
}

/** Local <video> card. */
function renderVideo(project) {
  return el(
    'div',
    { class: 'card-media' },
    mediaLink(project, videoElement(project.mediaUrl, project.posterUrl, project.title)),
  );
}

/**
 * YouTube "lite" facade: poster + play button; the heavy iframe loads only on
 * click (handled by wireYouTube). Keeps cards fast/private until pressed.
 */
function youTubeFacade(id, title, posterUrl, start) {
  const poster = el('img', {
    class: 'card-asset',
    src: posterUrl || youTubeThumb(id),
    alt: title,
    loading: 'lazy',
    decoding: 'async',
  });
  return el(
    'button',
    {
      type: 'button',
      class: 'yt-facade',
      'aria-label': `Play video: ${title}`,
      'data-yt-id': id,
      'data-yt-title': title,
      'data-yt-start': start ? String(start) : null,
    },
    poster,
    el('span', { class: 'yt-play-btn', 'aria-hidden': 'true' }),
  );
}

/** Single YouTube card. */
function renderYouTube(project, id) {
  return el(
    'div',
    { class: 'card-media card-media-youtube' },
    youTubeFacade(id, project.title, project.posterUrl, youTubeStart(project.mediaUrl)),
  );
}

/** Static image card. */
function renderImage(project) {
  const img = el('img', {
    class: 'card-asset',
    src: project.mediaUrl,
    alt: project.title,
    loading: 'lazy',
    decoding: 'async',
  });
  return el('div', { class: 'card-media' }, mediaLink(project, img));
}

/** Does this URL point at a .gif (ignoring any query/hash)? */
function isGif(url) {
  return typeof url === 'string' && /\.gif(?:[?#]|$)/i.test(url);
}

/**
 * Build the freeze-on-hover GIF layers: a <canvas> snapshot of the first frame
 * (shown while idle) plus the live <img> on top. A GIF can't be paused, so the
 * canvas is the "paused" state and the .card-media-gif:hover rules reveal the
 * animating <img>. Returns [still, gif]; reused by single GIFs and galleries.
 */
function gifFreeze(url, alt) {
  const gif = el('img', {
    class: 'card-asset card-gif',
    src: url,
    alt,
    loading: 'lazy',
    decoding: 'async',
  });
  const still = el('canvas', { class: 'card-asset card-gif-still', 'aria-hidden': 'true' });
  const snapshot = () => {
    if (!gif.naturalWidth) return;
    still.width = gif.naturalWidth;
    still.height = gif.naturalHeight;
    const ctx = still.getContext('2d');
    if (ctx) ctx.drawImage(gif, 0, 0);
  };
  if (gif.complete) snapshot();
  else gif.addEventListener('load', snapshot, { once: true });
  return [still, gif];
}

/** Single GIF card that plays only on hover. */
function renderGif(project) {
  const media = el('div', { class: 'card-media card-media-gif' }, ...gifFreeze(project.mediaUrl, project.title));

  // Keep linkUrl support via an overlay anchor (the stacked layers are absolute).
  if (project.linkUrl) {
    const link = el('a', {
      class: 'card-gif-link',
      href: project.linkUrl,
      rel: 'noopener',
      'aria-label': `${project.title} — open link`,
    });
    if (/^https?:/i.test(project.linkUrl)) link.target = '_blank';
    media.append(link);
  }
  return media;
}

/**
 * One carousel slide, rendered by its own media type so a gallery can mix a
 * YouTube embed, GIFs, a video, and images. YouTube slides are flagged
 * `interactive` so their click plays the video instead of advancing.
 */
function gallerySlide(src, project, i, count) {
  const label = `${project.title} — image ${i + 1} of ${count}`;
  const ytId = youTubeId(src);
  if (ytId) {
    const slide = el(
      'div',
      { class: 'card-gallery-slide card-media-youtube' },
      youTubeFacade(ytId, project.title, project.posterUrl, youTubeStart(src)),
    );
    slide.dataset.interactive = 'true';
    return slide;
  }
  if (isGif(src)) {
    return el('div', { class: 'card-gallery-slide card-media-gif' }, ...gifFreeze(src, label));
  }
  // Only the first slide (mediaUrl) can be a local video; gallery extras are images.
  if (i === 0 && project.isVideo) {
    return el('div', { class: 'card-gallery-slide' }, videoElement(src, project.posterUrl, label));
  }
  return el(
    'div',
    { class: 'card-gallery-slide' },
    el('img', { class: 'card-asset', src, alt: label, loading: i === 0 ? 'eager' : 'lazy', decoding: 'async' }),
  );
}

/**
 * Image carousel: shows mediaUrl first, then each gallery image. Prev/next
 * arrows (and clicking a non-interactive slide) cycle through, wrapping at the
 * ends. Image/GIF slides are preloaded so swaps are instant. Click/tap based,
 * so it works on mobile too.
 */
function renderGallery(project) {
  const sources = [project.mediaUrl, ...project.gallery].filter(Boolean);

  // Preload image/GIF slides (skip YouTube — its embed URL isn't an image).
  for (const src of sources) {
    if (youTubeId(src)) continue;
    const pre = new Image();
    pre.src = src;
  }

  // One stacked layer per slide; only the active one is shown.
  const slides = sources.map((src, i) => gallerySlide(src, project, i, sources.length));

  let index = 0;
  const counter = el('span', { class: 'card-gallery-counter' });
  const show = (next) => {
    slides[index].classList.remove('is-active');
    index = (next + slides.length) % slides.length;
    slides[index].classList.add('is-active');
    counter.textContent = `${index + 1} / ${slides.length}`;
  };
  slides[0].classList.add('is-active');
  counter.textContent = `1 / ${slides.length}`;

  const prev = el('button', {
    type: 'button',
    class: 'card-gallery-arrow card-gallery-prev',
    'aria-label': 'Previous image',
    text: '‹',
  });
  const nextBtn = el('button', {
    type: 'button',
    class: 'card-gallery-arrow card-gallery-next',
    'aria-label': 'Next image',
    text: '›',
  });
  prev.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  // Click a slide to advance — except interactive slides (a YouTube facade needs
  // its click to play). Arrows sit above via z-index so they don't double-fire.
  for (const slide of slides) {
    if (slide.dataset.interactive) continue;
    slide.addEventListener('click', () => show(index + 1));
  }

  return el(
    'div',
    { class: 'card-media card-media-gallery', role: 'group', 'aria-label': `${project.title} images` },
    ...slides,
    prev,
    nextBtn,
    counter,
  );
}

/** Pick the right media renderer. A gallery (carousel) wins over single media. */
function renderMedia(project) {
  if (Array.isArray(project.gallery) && project.gallery.length) return renderGallery(project);
  const ytId = youTubeId(project.mediaUrl);
  if (ytId) return renderYouTube(project, ytId);
  if (isGif(project.mediaUrl)) return renderGif(project);
  if (project.isVideo) return renderVideo(project);
  return renderImage(project);
}

/**
 * Optional "Play" / "Code" call-to-action buttons. Each appears only when its
 * URL is set in projects.json; returns null when neither exists (no empty row).
 */
function cardButtons(project) {
  const specs = [
    { label: 'Play', href: project.playUrl, icon: 'play', variant: 'primary' },
    { label: 'Code', href: project.codeUrl, icon: 'code', variant: 'secondary' },
    { label: 'How I Made It', href: project.blogUrl, icon: 'blog', variant: 'tertiary' },
  ].filter((b) => b.href);
  if (!specs.length) return null;

  const row = el('div', { class: 'card-buttons' });
  for (const b of specs) {
    const link = el(
      'a',
      { class: `card-button card-button-${b.variant}`, href: b.href, rel: 'noopener' },
      icon(b.icon),
      el('span', { text: b.label }),
    );
    if (/^https?:/i.test(b.href)) link.target = '_blank';
    row.append(link);
  }
  return row;
}

/** A single project card: media on one side, details accordion on the other. */
function renderCard(project) {
  const media = renderMedia(project);

  const tags = el('ul', { class: 'card-tags' });
  for (const cat of project.categories || []) tags.append(el('li', { text: cat }));

  const accordion = el('div', { class: 'accordion' });
  for (const [label, value] of [
    ['Group Size', project.groupSize],
    ['My Contributions', project.contributions],
    ['Summary', project.summary],
  ]) {
    const item = accordionItem(label, value);
    if (item) accordion.append(item);
  }

  const body = el(
    'div',
    { class: 'card-body' },
    el('h2', { class: 'card-title', text: project.title }),
    tags,
    cardButtons(project), // null when no playUrl/codeUrl — el() skips null children
    accordion,
  );

  return el('article', { class: 'card' }, media, body);
}

function errorState(message) {
  return el(
    'div',
    { class: 'state state-error', role: 'alert' },
    el('p', { text: message }),
  );
}

function emptyState(message) {
  return el('div', { class: 'state state-empty' }, el('p', { text: message }));
}

/** Project grid page (gamedev/techart/swe). */
function renderProjects(main, site, projects) {
  const category = main.dataset.category;
  const meta = site?.categories?.[category];

  const header = el(
    'section',
    { class: 'projects-intro' },
    el('h1', { class: 'projects-title', text: meta?.title || category }),
    meta?.blurb ? el('p', { class: 'projects-blurb', text: meta.blurb }) : null,
  );

  const grid = el('section', { class: 'card-list' });

  if (!Array.isArray(projects)) {
    grid.append(errorState('Projects could not be loaded. Please try again later.'));
  } else {
    const matches = projects.filter(
      (p) => Array.isArray(p.categories) && p.categories.includes(category),
    );
    if (matches.length === 0) {
      grid.append(emptyState('No projects to show here yet — check back soon.'));
    } else {
      for (const project of matches) grid.append(renderCard(project));
    }
  }

  main.replaceChildren(header, grid);
}

/** Swap a clicked YouTube facade for the real autoplaying iframe. */
function wireYouTube(root) {
  root.addEventListener('click', (event) => {
    const facade = event.target.closest('.yt-facade');
    if (!facade || !root.contains(facade)) return;
    const id = facade.dataset.ytId;
    if (!id) return;
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });
    if (facade.dataset.ytStart) params.set('start', facade.dataset.ytStart);
    const iframe = el('iframe', {
      class: 'card-asset',
      src: `https://www.youtube.com/embed/${id}?${params}`,
      title: facade.dataset.ytTitle || 'Video',
      allow: 'autoplay; encrypted-media; picture-in-picture; web-share',
      allowFullscreen: true,
    });
    facade.replaceWith(iframe);
  });
}

/** One delegated click handler drives every accordion on the page. */
function wireAccordions(root) {
  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('.accordion-trigger');
    if (!trigger || !root.contains(trigger)) return;
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
  });
}

async function init() {
  const main = document.querySelector('main');
  if (!main) return;

  const isCategory = Boolean(main.dataset.category);
  const isWork = main.dataset.page === 'work';
  const [site, projects, work] = await Promise.all([
    loadJson(siteUrl, 'site.json'),
    isCategory ? loadJson(projectsUrl, 'projects.json') : Promise.resolve(null),
    isWork ? loadJson(workUrl, 'work.json') : Promise.resolve(null),
  ]);

  // Navigation rules (no link ever points back to the master index):
  //  - home / about / work: the full nav — every category + Work Exp + About,
  //    minus a redundant link to the page you're already on.
  //  - category pages: just Work Exp + About, so tailored recruiter URLs stay
  //    isolated from each other.
  const page = main.dataset.page;
  let navLinks = [];
  if (page === 'home' || page === 'about' || page === 'work') {
    navLinks = [...categoryLinks(site), WORK_EX, ABOUT_PAGE].filter(
      (link) => !(page === 'about' && link === ABOUT_PAGE) && !(page === 'work' && link === WORK_EX),
    );
  } else if (isCategory) {
    navLinks = [WORK_EX, ABOUT_PAGE];
  }

  renderHeader(site, navLinks);
  renderFooter(site);

  if (isCategory) {
    renderProjects(main, site, projects);
    wireAccordions(main);
    wireYouTube(main);
  } else if (isWork) {
    renderWork(main, work);
  } else if (page === 'static') {
    // Static page (e.g. a blog write-up): the <main> content is authored in
    // plain HTML. We only render the shared header/footer above — leave it be.
  } else {
    // Master index and about page share this layout but use different bio copy:
    // the index uses site.intro (falling back to site.about), about uses site.about.
    const paragraphs = page === 'home' ? site?.intro || site?.about : site?.about;
    renderAbout(main, site, paragraphs);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
