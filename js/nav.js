export function closeMobileNav() {
  const navMobile = document.getElementById('nav-mobile');
  const navToggle = document.getElementById('nav-toggle');
  if (!navMobile || !navToggle) return;
  navMobile.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', '메뉴 열기');
  navMobile.hidden = true;
  document.body.style.overflow = '';
}

function openMobileNav() {
  const navMobile = document.getElementById('nav-mobile');
  const navToggle = document.getElementById('nav-toggle');
  if (!navMobile || !navToggle) return;
  navMobile.hidden = false;
  requestAnimationFrame(() => navMobile.classList.add('is-open'));
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', '메뉴 닫기');
  document.body.style.overflow = 'hidden';
}

export function initMobileNav() {
  const navToggle = document.getElementById('nav-toggle');
  const navMobile = document.getElementById('nav-mobile');

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMobileNav();
    else openMobileNav();
  });

  navMobile?.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });
}
