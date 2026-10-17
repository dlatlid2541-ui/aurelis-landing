import './products.js';
import './ingredients.js';
import './contact.js';

const header = document.getElementById('site-header');
const navToggle = document.getElementById('nav-toggle');
const navMobile = document.getElementById('nav-mobile');
const heroSection = document.getElementById('top');
const ritualSection = document.getElementById('ritual');
const ritualVideo = document.querySelector('.ritual-video');
const heroVideo = document.querySelector('.hero-video');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHeader() {
  if (!header || !heroSection) return;
  const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
  const scrollY = window.scrollY;
  header.classList.toggle('is-scrolled', scrollY > 24);
  header.classList.toggle('is-over-hero', scrollY < heroBottom - varHeaderHeight());
}

function varHeaderHeight() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 72;
}

function closeMobileNav() {
  if (!navMobile || !navToggle) return;
  navMobile.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', '메뉴 열기');
  navMobile.hidden = true;
  document.body.style.overflow = '';
}

function openMobileNav() {
  if (!navMobile || !navToggle) return;
  navMobile.hidden = false;
  requestAnimationFrame(() => navMobile.classList.add('is-open'));
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', '메뉴 닫기');
  document.body.style.overflow = 'hidden';
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  if (isOpen) closeMobileNav();
  else openMobileNav();
});

navMobile?.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', closeMobileNav);
});

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

if (!prefersReducedMotion) {
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  heroVideo?.pause();
  if (ritualVideo) {
    ritualVideo.removeAttribute('autoplay');
    ritualVideo.pause();
  }
}

if (ritualVideo && !prefersReducedMotion) {
  const ritualObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ritualVideo.play().catch(() => {});
        } else {
          ritualVideo.pause();
        }
      });
    },
    { threshold: 0.25 }
  );
  if (ritualSection) ritualObserver.observe(ritualSection);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileNav();
});

const heroReveal = heroSection?.querySelector('.reveal');
if (heroReveal) heroReveal.classList.add('is-visible');

export { closeMobileNav, prefersReducedMotion };
