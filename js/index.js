/* ============================================================
   index.js — Main page scripts
   Wedding website: Rocío & Emilio · 12.09.2026
   rocioyemilio.es
   ============================================================ */

/* ============================================================
   HERO — Viewport height lock
   Prevents layout reflow on mobile when the browser nav bar
   appears/disappears during scroll (Safari, Brave, Chrome mobile).

   Key insight: the nav bar changes ONLY the viewport height,
   never the width. So we ignore resize events where the width
   stays the same (nav bar toggling) and only update when width
   changes (orientation change or real desktop resize).
   ============================================================ */
(function lockHeroHeight() {
  var root = document.documentElement;
  var lockedW = window.innerWidth;

  function lock() {
    root.style.setProperty('--hero-h', window.innerHeight + 'px');
    lockedW = window.innerWidth;
  }

  lock();

  window.addEventListener('resize', function () {
    // Only update if width changed → real resize or orientation change.
    // Height-only change means browser nav bar showing/hiding → skip.
    if (window.innerWidth !== lockedW) {
      lock();
    }
  }, { passive: true });
}());

/* ============================================================
   STATE — shared variables for parallax and scroll tracking
   ============================================================ */
const heroEl    = document.getElementById('hero');
const heroTop   = document.getElementById('heroTop');
const heroChurch = document.getElementById('heroChurch');
const heroVines  = document.querySelectorAll('.hero-vine-left, .hero-vine-right');
const isTouch    = window.matchMedia('(hover: none)').matches;
const rsvpHintEl = document.querySelector('.hero-rsvp-hint');

/* Remove the CSS animation property once it ends, so the element
   can be controlled via opacity class toggles instead */
if (rsvpHintEl) {
  rsvpHintEl.addEventListener('animationend', () => {
    rsvpHintEl.style.animation = 'none';
    rsvpHintEl.style.opacity   = '';
  }, { once: true });
}

const skylineImg        = document.querySelector('#invitation-split .invitation-skyline');
const invitationSect    = document.getElementById('invitation-split');
const invitationTextCol = document.querySelector('#invitation-split .invitation-text-col');

/* Fix: remove clip-path after the name reveal animation ends.
   Leaving clip-path active causes a GPU compositing bug on mobile
   where text appears clipped after the page first loads. */
(function () {
  const heroNames = document.querySelector('.hero-names');
  if (!heroNames) return;
  function removeClip() { heroNames.style.clipPath = 'none'; }
  heroNames.addEventListener('animationend', removeClip, { once: true });
  /* Fallback in case animationend does not fire (reduced motion, etc.) */
  setTimeout(removeClip, 2500);
}());

let scrollOY   = 0;      // scroll-based Y offset for church
let mouseOX    = 0;      // lerped mouse X offset (-1 to 1)
let mouseOY    = 0;      // lerped mouse Y offset (-1 to 1)
let targetMX   = 0;
let targetMY   = 0;
let heroActive = false;  // is mouse inside hero?

/* ============================================================
   PARALLAX — Scroll-based transforms
   ============================================================ */
function applyChurchTransform() {
  if (!heroChurch) return;
  const scrollPart = scrollOY * 0.25;
  const mousePartY = mouseOY * -8;
  const mousePartX = mouseOX * -16;
  heroChurch.style.transform = `translateX(${mousePartX}px) translateY(${scrollPart + mousePartY}px)`;
}

function onScroll() {
  scrollOY = window.scrollY;

  /* RSVP hint: fade out smoothly on scroll via CSS class */
  if (rsvpHintEl) rsvpHintEl.classList.toggle('hidden', scrollOY > 80);

  /* Vines follow scroll only */
  heroVines.forEach(v => {
    v.style.transform = v.classList.contains('hero-vine-right')
      ? `translateY(${scrollOY * 0.12}px)`
      : `scaleX(-1) translateY(${scrollOY * 0.12}px)`;
  });

  applyChurchTransform();

  /* Skyline parallax: image moves relative to section as it scrolls into view.
     Disabled on mobile where the effect is less visible and costly. */
  if (skylineImg && invitationSect && window.innerWidth > 700) {
    const rect = invitationSect.getBoundingClientRect();
    const offset = rect.top * 0.12;
    skylineImg.style.transform = `translateY(${offset}px)`;
  } else if (skylineImg) {
    skylineImg.style.transform = '';
  }
}

/* Throttle scroll handler via requestAnimationFrame */
let rafScroll = false;
window.addEventListener('scroll', () => {
  if (!rafScroll) {
    requestAnimationFrame(() => { onScroll(); rafScroll = false; });
    rafScroll = true;
  }
}, { passive: true });

onScroll(); // run once on load to set initial state

/* ============================================================
   MOUSE PARALLAX — LERP animation loop
   Smooth mouse-tracking with linear interpolation (ease factor 0.07)
   Loop only runs while values are still converging; restarts on mousemove.
   ============================================================ */
let lerpRunning = false;

function lerpMouse() {
  const ease = 0.07;
  const tx = heroActive ? targetMX : 0;
  const ty = heroActive ? targetMY : 0;

  mouseOX += (tx - mouseOX) * ease;
  mouseOY += (ty - mouseOY) * ease;

  if (!isTouch && heroTop) {
    heroTop.style.transform = `translate(${mouseOX * 10}px, ${mouseOY * 6}px)`;
  }
  applyChurchTransform();

  if (Math.abs(tx - mouseOX) > 0.001 || Math.abs(ty - mouseOY) > 0.001) {
    requestAnimationFrame(lerpMouse);
  } else {
    lerpRunning = false;
  }
}

function startLerp() {
  if (!lerpRunning) {
    lerpRunning = true;
    requestAnimationFrame(lerpMouse);
  }
}

if (!isTouch && heroEl) {
  heroEl.addEventListener('mousemove', e => {
    heroActive = true;
    targetMX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
    startLerp();
  }, { passive: true });

  heroEl.addEventListener('mouseleave', () => { heroActive = false; startLerp(); });
}


/* ============================================================
   SCROLL REVEAL — IntersectionObserver for .aos elements
   Elements fade in when they enter the viewport (12% threshold)
   ============================================================ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.aos').forEach(el => revealObs.observe(el));

/* ============================================================
   STICKY RSVP BUTTON — Appears after scrolling past hero
   ============================================================ */
const stickyRsvp = document.getElementById('stickyRsvp');
if (stickyRsvp && heroEl) {
  const heroObs = new IntersectionObserver(entries => {
    entries[0].isIntersecting
      ? stickyRsvp.classList.remove('show')
      : stickyRsvp.classList.add('show');
  }, { threshold: 0.05 });
  heroObs.observe(heroEl);
}

/* ============================================================
   COUNTDOWN TIMER — Updates every second
   Target: September 12, 2026 at 18:00
   ============================================================ */
function pad(n) { return String(n).padStart(2, '0'); }

const _cdTarget = new Date('2026-09-12T18:00:00');
const _cdDays   = document.getElementById('cd-days');
const _cdHours  = document.getElementById('cd-hours');
const _cdMins   = document.getElementById('cd-mins');
const _cdSecs   = document.getElementById('cd-secs');

function updateCountdown() {
  const diff = _cdTarget - new Date();

  if (diff <= 0) {
    clearInterval(_cdInterval);
    const grid = document.getElementById('cdGrid');
    if (grid) grid.innerHTML = '<p class="cd-finish">¡Ya llegó el gran día!</p>';
    return;
  }

  const days  = Math.floor(diff / 864e5);
  const hours = Math.floor((diff % 864e5) / 36e5);
  const mins  = Math.floor((diff % 36e5)  / 6e4);
  const secs  = Math.floor((diff % 6e4)   / 1e3);

  if (_cdDays)  _cdDays.textContent  = pad(days);
  if (_cdHours) _cdHours.textContent = pad(hours);
  if (_cdMins)  _cdMins.textContent  = pad(mins);
  if (_cdSecs)  _cdSecs.textContent  = pad(secs);
}
updateCountdown();
const _cdInterval = setInterval(updateCountdown, 1000);

/* ============================================================
   FLOATING PETALS — Decorative petal animation in hero section
   ============================================================ */
(function spawnPetals() {
  const container = document.getElementById('petalContainer');
  if (!container) return;

  const COUNT = 10;
  for (let i = 0; i < COUNT; i++) {
    const p   = document.createElement('div');
    p.className = 'petal';
    const size = 9 + Math.random() * 10;
    const dur  = 14 + Math.random() * 12;
    const del  = -(Math.random() * dur);   // staggered start via negative delay
    const left = 5  + Math.random() * 90;
    const drift = (Math.random() - 0.5) * 100;
    const rot   = 180 + Math.random() * 360;

    p.style.cssText = `
      width:${size}px; height:${size * .75}px;
      top:0; left:${left}%;
      animation-name:petalFall;
      animation-duration:${dur}s;
      animation-delay:${del}s;
      --drift:${drift}px;
      --rot:${rot}deg;
    `;
    container.appendChild(p);
  }
}());

/* ============================================================
   CHURCH IMAGE ENTRANCE — Fade in after page load
   ============================================================ */
(function () {
  if (!heroChurch) return;
  heroChurch.style.opacity = '0';
  heroChurch.style.transition = 'opacity 1.1s ease .5s';
  setTimeout(() => { heroChurch.style.opacity = '1'; }, 30);
  setTimeout(() => { heroChurch.style.transition = ''; }, 1800);
}());

/* ============================================================
   BOOK OPENING ANIMATION — Full-screen intro overlay
   ============================================================ */
(function () {
  var intro = document.getElementById('book-intro');
  if (!intro) return;

  var done = false;

  /* Lock scroll without layout jump:
     compensate for the scrollbar gap before hiding it */
  function lockScroll() {
    var sbWidth = window.innerWidth - document.documentElement.clientWidth;
    if (sbWidth > 0) document.body.style.paddingRight = sbWidth + 'px';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* Lock scroll immediately on load */
  lockScroll();

  function closeIntro() {
    if (done) return;
    done = true;

    intro.classList.add('opening');
    setTimeout(function () {
      unlockScroll();           // covers have already rotated → no visible jump
      intro.classList.add('fade-out');
      setTimeout(function () {
        intro.style.display = 'none';
      }, 650);
    }, 1200);
  }

  /* Wait until all intro images are fully loaded */
  var introImgs = Array.from(intro.querySelectorAll('img'));
  var imagePromises = introImgs.map(function (img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(function (res) {
      img.addEventListener('load',  res, { once: true });
      img.addEventListener('error', res, { once: true }); // never block on error
    });
  });

  /* Fade in images once ready, to prevent flash of unloaded content */
  Promise.all(imagePromises).then(function () {
    intro.classList.add('images-ready');
  });

  /* Auto-open: wait at least 1.2s AND for all images to be loaded */
  var timerPromise = new Promise(function (res) { setTimeout(res, 1200); });
  Promise.all([timerPromise].concat(imagePromises)).then(closeIntro);

  /* Allow click/tap to skip the intro immediately */
  intro.addEventListener('click', closeIntro);
  intro.addEventListener('touchstart', closeIntro, { passive: true });
}());

/* ============================================================
   ACCORDION — Hotels & Transport toggle
   ============================================================ */
(function () {
  var closedLabels = {
    alojamiento: 'Ver alojamientos \u2193',
    transporte:  'Ver información del transporte \u2193'
  };
  var openLabels = {
    alojamiento: 'Cerrar alojamientos \u2191',
    transporte:  'Cerrar información del transporte \u2191'
  };

  document.querySelectorAll('.accordion-btn').forEach(function (btn) {
    function toggleAccordion(e) {
      e.preventDefault();
      var key  = btn.dataset.accordion;
      var body = document.getElementById('accordion-' + key);
      if (!body) return;

      var isOpen  = btn.getAttribute('aria-expanded') === 'true';
      var labelEl = btn.querySelector('span');

      if (isOpen) {
        body.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        body.setAttribute('aria-hidden', 'true');
        if (labelEl) labelEl.textContent = closedLabels[key] || 'Ver \u2193';
      } else {
        body.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        body.setAttribute('aria-hidden', 'false');
        if (labelEl) labelEl.textContent = openLabels[key] || 'Cerrar \u2191';
      }
    }

    /* touchend with preventDefault prevents the ~300ms synthetic click on iOS */
    btn.addEventListener('touchend', function (e) {
      e.preventDefault();
      toggleAccordion(e);
    });
    btn.addEventListener('click', toggleAccordion);
  });

  /* .btn-rsvp: fire immediately on first touch on mobile (same pattern as accordion) */
  document.querySelectorAll('.btn-rsvp').forEach(function (btn) {
    btn.addEventListener('touchend', function (e) {
      e.preventDefault(); // prevents the ~300ms synthetic click on iOS
      window.location.href = btn.getAttribute('href');
    }, { passive: false });
  });
}());

/* ============================================================
   HOTEL IMAGE PRELOAD — Deferred after window load
   Images are cached before user opens the accordion panel.
   ============================================================ */
window.addEventListener('load', function () {
  [
    'illustrations/hoteles/achotel.webp',
    'illustrations/hoteles/melia.webp',
    'illustrations/hoteles/hospesamerigo.webp'
  ].forEach(function (src) {
    var img = new Image();
    img.src = src;
  });
});

/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
(function () {
  var btn = document.getElementById('btn-top');

  /* Detect Safari iOS — excludes Chrome/CriOS, Firefox/FxiOS, Brave, Edge/EdgiOS.
     Used to add extra bottom offset for the browser toolbar claim area. */
  var ua = navigator.userAgent;
  var isIOSSafari = /iP(hone|ad|od)/.test(ua) &&
                    /WebKit/.test(ua) &&
                    !/CriOS|FxiOS|OPiOS|EdgiOS|Brave/.test(ua);
  if (isIOSSafari) btn.classList.add('safari-ios');

  var introEl = document.getElementById('book-intro');
  function introFinished() {
    return !introEl || introEl.style.display === 'none';
  }

  var rafScrollTop = false;
  window.addEventListener('scroll', function () {
    if (!introFinished()) return;
    if (!rafScrollTop) {
      rafScrollTop = true;
      requestAnimationFrame(function () {
        btn.classList.toggle('visible', window.scrollY > 300);
        rafScrollTop = false;
      });
    }
  }, { passive: true });

  function scrollToTop(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  btn.addEventListener('touchend', scrollToTop, { passive: false });
  btn.addEventListener('click', scrollToTop);
}());

/* ============================================================
   VIDEO PLAYER — Vimeo mute/unmute control
   The Vimeo Player SDK (loaded via CDN before this script) is
   used to control volume without showing the native controls.
   ============================================================ */
(function () {
  var iframe  = document.getElementById('vimeo-main');
  var muteBtn = document.getElementById('btn-mute-video');
  if (!iframe || !muteBtn) return;

  var player  = new Vimeo.Player(iframe);
  var isMuted = true; // always starts muted per autoplay policy

  function updateBtn() {
    muteBtn.textContent = isMuted ? 'Activar Sonido' : 'Desactivar Sonido';
    muteBtn.setAttribute('aria-label', muteBtn.textContent);
  }

  function toggleMute(e) {
    e.preventDefault();
    e.stopPropagation();
    isMuted = !isMuted;
    if (isMuted) {
      player.setMuted(true);
    } else {
      /* Set volume first, then unmute — avoids sudden loud audio */
      player.setVolume(0.15).then(function () {
        return player.setMuted(false);
      });
    }
    updateBtn();
  }

  /* Ensure the video is muted on load (browser autoplay policy requires it) */
  player.ready().then(function () {
    player.setMuted(true);
    isMuted = true;
    updateBtn();
  });

  /* touchend with preventDefault avoids the double-trigger on mobile */
  muteBtn.addEventListener('touchend', toggleMute, { passive: false });
  /* click for desktop — guard against double-fire after touchend on touch devices */
  muteBtn.addEventListener('click', function (e) {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    toggleMute(e);
  });
}());
