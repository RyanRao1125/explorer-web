// ==========================================================================
// Explorer Robotics — Shared JS
// ==========================================================================

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close menu when a link is tapped (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Animated stat counters (homepage hero)
function animateCount(el, target, duration = 1400) {
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.floor(start + (target - start) * eased);
    el.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(tick);
}

const statTargets = {
  OverallMembers: 50,
  InternationalRankings: 12,
  statYears: 10
};

const statEls = Object.keys(statTargets)
  .map(id => document.getElementById(id))
  .filter(Boolean);

if (statEls.length) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = statTargets[el.id];
        if (prefersReducedMotion) {
          el.textContent = target;
        } else {
          animateCount(el, target);
        }
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  statEls.forEach(el => observer.observe(el));
}

// ── Page load animations ──
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
});

// ── Scroll animations ──
const animateEls = document.querySelectorAll(
  '.badge, .section, .photo-slot, .news-feature, .news-item, .why-item, .classes-teaser'
);

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      scrollObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

animateEls.forEach(el => {
  el.classList.add('animate-ready');
  scrollObserver.observe(el);
});