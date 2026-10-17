const grid = document.getElementById('ingredients-grid');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderIngredientCard(item) {
  const card = document.createElement('article');
  card.className = 'ingredient-card reveal';
  card.innerHTML = `
    <div class="ingredient-card__image-wrap">
      <img
        class="ingredient-card__image"
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.nameKo)}(${escapeHtml(item.nameEn)}) 성분 이미지"
        width="640"
        height="480"
        loading="lazy"
      />
    </div>
    <div class="ingredient-card__body">
      <h3 class="ingredient-card__title">
        <span class="ingredient-card__name-en">${escapeHtml(item.nameEn)}</span>
        <span class="ingredient-card__name-ko">${escapeHtml(item.nameKo)}</span>
      </h3>
      <p class="ingredient-card__desc">${escapeHtml(item.description)}</p>
    </div>
  `;
  return card;
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

async function initIngredients() {
  if (!grid) return;
  try {
    const res = await fetch('/data/ingredients.json');
    if (!res.ok) throw new Error('Failed to load ingredients');
    const items = await res.json();
    items.forEach((item) => grid.appendChild(renderIngredientCard(item)));
    observeNewReveals(grid);
  } catch (err) {
    grid.innerHTML =
      '<p>성분 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    console.error(err);
  }
}

initIngredients();
