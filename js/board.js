import { assertSupabase } from './supabaseClient.js';
import { initAuthUI, requireAuth } from './auth-ui.js';
import { initMobileNav } from './nav.js';

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function setStatus(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('form-status--error', isError);
  el.classList.toggle('form-status--success', !isError && Boolean(message));
}

function renderPosts(listEl, posts) {
  if (!listEl) return;
  if (!posts.length) {
    listEl.innerHTML = '<p class="board-empty">아직 작성된 글이 없습니다. 첫 글을 남겨 보세요.</p>';
    return;
  }

  listEl.innerHTML = posts
    .map(
      (post) => `
    <article class="board-post">
      <header class="board-post__head">
        <h2 class="board-post__title">${escapeHtml(post.title)}</h2>
        <p class="board-post__meta">${escapeHtml(post.author_email ?? '회원')} · ${formatDate(post.created_at)}</p>
      </header>
      <div class="board-post__body">${escapeHtml(post.content).replace(/\n/g, '<br />')}</div>
    </article>
  `
    )
    .join('');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadPosts(listEl) {
  const client = assertSupabase();
  const { data, error } = await client
    .from('posts')
    .select('id, title, content, author_email, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  renderPosts(listEl, data ?? []);
}

function bindCompose(session) {
  const form = document.getElementById('board-compose-form');
  const statusEl = document.getElementById('board-compose-status');
  const listEl = document.getElementById('board-post-list');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(statusEl, '', false);

    const title = form.title.value.trim();
    const content = form.content.value.trim();
    if (title.length < 2 || content.length < 5) {
      setStatus(statusEl, '제목(2자 이상)과 내용(5자 이상)을 입력해 주세요.', true);
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;

    try {
      const client = assertSupabase();
      const { error } = await client.from('posts').insert({
        title,
        content,
        user_id: session.user.id,
        author_email: session.user.email,
      });
      if (error) throw error;

      form.reset();
      setStatus(statusEl, '글이 등록되었습니다.', false);
      await loadPosts(listEl);
    } catch (err) {
      setStatus(statusEl, err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function boot() {
  initMobileNav();
  await initAuthUI();

  const session = await requireAuth();
  if (!session) return;

  const listEl = document.getElementById('board-post-list');
  const loadingEl = document.getElementById('board-loading');

  try {
    await loadPosts(listEl);
  } catch (err) {
    if (listEl) {
      listEl.innerHTML = `<p class="board-empty board-empty--error">${escapeHtml(err.message)}</p>`;
    }
  } finally {
    loadingEl?.remove();
  }

  bindCompose(session);
}

boot();
