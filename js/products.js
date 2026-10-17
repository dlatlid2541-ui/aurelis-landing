const grid = document.getElementById('products-grid');
const productSelect = document.getElementById('product-interest');

let productsCache = [];

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card reveal';
  card.style.setProperty('--accent', product.accentColor);
  card.innerHTML = `
    <div class="product-card__image-wrap">
      <img
        class="product-card__image"
        src="${escapeHtml(product.image)}"
        alt="${escapeHtml(product.name)}"
        width="640"
        height="800"
        loading="lazy"
      />
    </div>
    <div class="product-card__body">
      <p class="product-card__line">${escapeHtml(product.line)}</p>
      <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
      <p class="product-card__volume">${escapeHtml(product.volume)}</p>
      <p class="product-card__message">${escapeHtml(product.message)}</p>
      <p class="product-card__benefits">${escapeHtml(product.benefits)}</p>
      <button
        type="button"
        class="btn btn-outline-dark product-inquiry-btn"
        data-slug="${escapeHtml(product.slug)}"
        data-label="${escapeHtml(product.inquiry_label)}"
      >
        문의하기
      </button>
    </div>
  `;
  return card;
}

function populateProductSelect(products) {
  if (!productSelect) return;
  products.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.inquiry_label;
    opt.textContent = p.name;
    productSelect.appendChild(opt);
  });
}

function prefillFromQuery(products) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('product');
  if (!slug || !productSelect) return;
  const match = products.find((p) => p.slug === slug);
  if (match) applyProductPrefill(match.inquiry_label, '제품');
}

export function applyProductPrefill(inquiryLabel, typeValue = '제품') {
  const typeSelect = document.getElementById('inquiry-type');
  if (typeSelect && typeValue) typeSelect.value = typeValue;
  if (productSelect && inquiryLabel) productSelect.value = inquiryLabel;
}

function bindInquiryButtons() {
  document.querySelectorAll('.product-inquiry-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const label = btn.getAttribute('data-label');
      applyProductPrefill(label, '제품');
      const contact = document.getElementById('contact');
      contact?.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('contact-name')?.focus({ preventScroll: true });
    });
  });
}

function observeNewReveals(container) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    container.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  container.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

async function initProducts() {
  if (!grid) return;
  try {
    const res = await fetch('/data/products.json');
    if (!res.ok) throw new Error('Failed to load products');
    productsCache = await res.json();
    productsCache.forEach((product) => {
      grid.appendChild(renderProductCard(product));
    });
    populateProductSelect(productsCache);
    bindInquiryButtons();
    observeNewReveals(grid);
    prefillFromQuery(productsCache);
  } catch (err) {
    grid.innerHTML = '<p>제품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    console.error(err);
  }
}

initProducts();

export { productsCache };
