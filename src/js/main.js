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
const ABOUT_PAGE = { label: 'About / Contact', href: '/about.html' };

/** One nav link per category, derived from site.json (data-driven). */
function categoryLinks(site) {
  return Object.entries(site?.categories || {}).map(([key, meta]) => ({
    label: meta.navLabel || meta.title || key,
    href: `/${key}.html`,
  }));
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

  mount.replaceChildren(el('div', { class: 'header-inner' }, identity, actions));
}

function renderFooter(site) {
  const mount = document.querySelector('[data-site-footer]');
  if (!mount || !site) return;
  const year = new Date().getFullYear();
  mount.replaceChildren(
    el('p', { class: 'footer-copy', text: `© ${year} ${site.name}` }),
  );
}

/** Landing / about page (index.html). */
function renderAbout(main, site) {
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
  for (const para of site.about || []) body.append(el('p', { text: para }));
  intro.append(body);
  intro.append(contactList(site.contacts, 'about-contacts'));
  main.replaceChildren(intro);
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

/** Local <video>: muted, looping, autoplaying thumbnail with a poster fallback. */
function renderVideo(project) {
  const video = el('video', {
    class: 'card-asset',
    src: project.mediaUrl,
    poster: project.posterUrl || null,
    muted: true,
    loop: true,
    autoplay: true,
    playsInline: true,
    preload: 'metadata',
  });
  video.setAttribute('playsinline', '');
  return el('div', { class: 'card-media' }, mediaLink(project, video));
}

/**
 * YouTube "lite" facade: show the poster (explicit or YouTube's thumbnail) with
 * a play button, and only load the heavy iframe on click. Keeps every card fast
 * and private until the visitor actually presses play.
 */
function renderYouTube(project, id) {
  const poster = el('img', {
    class: 'card-asset',
    src: project.posterUrl || youTubeThumb(id),
    alt: project.title,
    loading: 'lazy',
    decoding: 'async',
  });
  const facade = el(
    'button',
    {
      type: 'button',
      class: 'yt-facade',
      'aria-label': `Play video: ${project.title}`,
      'data-yt-id': id,
      'data-yt-title': project.title,
    },
    poster,
    el('span', { class: 'yt-play-btn', 'aria-hidden': 'true' }),
  );
  return el('div', { class: 'card-media card-media-youtube' }, facade);
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

/** Pick the right media renderer. YouTube links win regardless of isVideo. */
function renderMedia(project) {
  const ytId = youTubeId(project.mediaUrl);
  if (ytId) return renderYouTube(project, ytId);
  if (project.isVideo) return renderVideo(project);
  return renderImage(project);
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
  const [site, projects] = await Promise.all([
    loadJson(siteUrl, 'site.json'),
    isCategory ? loadJson(projectsUrl, 'projects.json') : Promise.resolve(null),
  ]);

  // Navigation rules:
  //  - home (master index): links to every section + the standalone About page.
  //  - category pages: link only to the About page — never back to the master
  //    and never to each other (tailored recruiter URLs stay isolated).
  //  - about page: no nav, so it can't link back to the master either.
  let navLinks = [];
  if (main.dataset.page === 'home') navLinks = [...categoryLinks(site), ABOUT_PAGE];
  else if (isCategory) navLinks = [ABOUT_PAGE];

  renderHeader(site, navLinks);
  renderFooter(site);

  if (isCategory) {
    renderProjects(main, site, projects);
    wireAccordions(main);
    wireYouTube(main);
  } else {
    // Both the master index and the standalone about page show the same
    // identity/contact content; only their nav (above) differs.
    renderAbout(main, site);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
