// === Main interactions ===
document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll for anchor links (offset handled via CSS scroll-margin-top)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", e => {
      const id = anchor.getAttribute("href").slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Flip effect for interest circles (click/tap)
  document.querySelectorAll(".about-interests li").forEach(li => {
    li.addEventListener("click", () => li.classList.toggle("flipped"));
  });

  // Active nav link based on current page (keeps your original behavior)
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navigation-list__item").forEach(link => {
    const linkPath = link.getAttribute("href").split("/").pop();
    if (linkPath === currentPath) link.classList.add("navigation-list__item--active");
  });

  // Hamburger menu toggle (and aria-expanded)
  const toggleButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav");
  const navLinks = document.querySelectorAll(".navigation-list__item");
  if (toggleButton && nav) {
    toggleButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("show");
      toggleButton.classList.toggle("open-menu", isOpen);
      toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("show");
        toggleButton.classList.remove("open-menu");
        toggleButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Project cards slide-in animation
  const projectCards = document.querySelectorAll(".project-card");
  const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(index % 2 === 0 ? "slide-left" : "slide-right");
        projectObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  projectCards.forEach(card => projectObserver.observe(card));

  // Animate home title and name
  const homeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('animate-pop');
        if (el.classList.contains('home-name')) {
          el.classList.add('animate-type');
        }
      } else {
        el.classList.remove('animate-pop', 'animate-type');
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.home-title, .home-name').forEach(el => {
    homeObserver.observe(el);
  });
});

// === Endorsements Carousel ===
(function () {
  const track = document.querySelector(".endorsements__track");
  if (!track) return;

  const slides = Array.from(track.children);
  const prevBtn = document.querySelector(".endorsements__nav.prev");
  const nextBtn = document.querySelector(".endorsements__nav.next");
  const dotsWrap = document.querySelector(".endorsements__dots");

  // Build dots
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Go to quote ${i + 1}`);
    if (i === 0) b.setAttribute("aria-current", "true");
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  let current = 0;

  const slideTo = index => {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    const x = slides[clamped].offsetLeft - 8;
    track.scrollTo({ left: x, behavior: "smooth" });
    dots.forEach((d, i) => d.toggleAttribute("aria-current", i === clamped));
    current = clamped;
  };

  if (nextBtn) nextBtn.addEventListener("click", () => slideTo(current + 1));
  if (prevBtn) prevBtn.addEventListener("click", () => slideTo(current - 1));
  dots.forEach((d, i) => d.addEventListener("click", () => slideTo(i)));

  // Sync dots on manual scroll
  let ticking = false;
  track.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const center = track.scrollLeft + track.clientWidth / 2;
      const idx = slides.reduce((best, el, i) => {
        const mid = el.offsetLeft + el.clientWidth / 2;
        const dist = Math.abs(center - mid);
        return dist < best.dist ? { i, dist } : best;
      }, { i: 0, dist: 1e9 }).i;
      dots.forEach((d, k) => d.toggleAttribute("aria-current", k === idx));
      current = idx;
      ticking = false;
    });
  });

  // Auto-advance (pause on interaction)
  let timer = setInterval(() => slideTo(current + 1), 6000);
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { if (!timer) timer = setInterval(() => slideTo(current + 1), 6000); };
  track.addEventListener("mouseenter", stop);
  track.addEventListener("mouseleave", start);
  track.addEventListener("touchstart", stop, { passive: true });
  track.addEventListener("touchend", start);
})();

// ---------- Unified Modal Engine (supports [data-modal-target]) ----------
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  if (!modal) return;

  const titleEl = modal.querySelector('#modal-title');
  const bodyEl  = modal.querySelector('#modal-body');

  let lastTrigger = null;
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.modal-trigger,[data-modal],[data-modal-target]');
    if (t) lastTrigger = t;
  }, true);

  const open = (title, html) => {
    titleEl.textContent = title || '';
    bodyEl.innerHTML = html || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    const dialog = modal.querySelector('.modal__dialog');
    if (dialog) dialog.focus();
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
  };

  // Close on backdrop / button / ESC
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal__backdrop')) close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  // Delegate clicks from any element intended to trigger a modal
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.modal-trigger,[data-modal],[data-modal-target]');
    if (!trigger) return;

    e.preventDefault();

    // Style A: data-modal-target="#modal-id"  -> pull title/body from the hidden modal block
    if (trigger.dataset.modalTarget) {
      const sel = trigger.dataset.modalTarget;
      const src = document.querySelector(sel);
      if (!src) return;

      const dialog = src.querySelector('.modal__dialog') || src;
      const title  = dialog.querySelector('h3')?.textContent
                  || trigger.getAttribute('data-modal-title')
                  || trigger.querySelector('p, h2, h3, h4')?.textContent
                  || 'Details';

      // Clone and strip the close button + heading so we just get the body copy
      const tmp = dialog.cloneNode(true);
      tmp.querySelector('.modal__close')?.remove();
      tmp.querySelector('h3')?.remove();
      const html = tmp.innerHTML.trim();

      open(title, html);
      return;
    }

    // Style B: data-modal / data-modal-title / data-modal-html (not used here but supported)
    const title = trigger.getAttribute('data-modal-title')
               || trigger.querySelector('h3, h2, h4')?.textContent
               || 'Details';
    const html  = trigger.getAttribute('data-modal-html')
               || trigger.getAttribute('data-modal-text')
               || trigger.dataset.modal
               || '';
    open(title, html);
  });
});

// --- Make ALL tech labels clickable to open their related skill/tech modal ---
document.addEventListener('DOMContentLoaded', () => {
  const map = {
    // Core web skills (already exist)
    'HTML': '#modal-html',
    'CSS': '#modal-css',
    'JavaScript': '#modal-js',
    'JS': '#modal-js',
    'React': '#modal-react',
    'Angular': '#modal-angular',
    'Python': '#modal-python',
    'Django': '#modal-django',
    'SQL': '#modal-sql',
    'PostgreSQL': '#modal-sql',

    // New lightweight tech modals
    'React Native': '#modal-react-native',
    'Firebase': '#modal-firebase',
    'Expo': '#modal-expo',
    'PWA': '#modal-pwa',
    'Google Calendar API': '#modal-gcal',
    'Heroku': '#modal-heroku',
    'AWS S3': '#modal-aws',
    'S3': '#modal-aws',
    'Pandas': '#modal-pandas',
    'Matplotlib': '#modal-matplotlib',
    'Node.js': '#modal-node',
    'Node': '#modal-node',
    'MongoDB': '#modal-mongodb',
    'Express': '#modal-express',
    'TypeScript': '#modal-typescript',
    'SCSS': '#modal-scss'
  };

  const badges = document.querySelectorAll('#work .project-buttons.tech-stack .tech-badge');
  badges.forEach(badge => {
    const key = badge.textContent.trim();
    const target = map[key];
    if (!target) return; // leave non-mapped tags alone (if any)

    // Promote to modal trigger
    badge.classList.add('is-link');
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('data-modal-target', target);

    // Keyboard access
    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); badge.click(); }
    });
  });
});

