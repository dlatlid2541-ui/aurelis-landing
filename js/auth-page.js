import { assertSupabase } from './supabaseClient.js';
import { initAuthUI, loginRedirectUrl } from './auth-ui.js';
import { initMobileNav } from './nav.js';

function setStatus(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('form-status--error', isError);
  el.classList.toggle('form-status--success', !isError && Boolean(message));
}

function translateAuthError(message) {
  if (!message) return '요청을 처리하지 못했습니다.';
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (message.includes('User already registered')) return '이미 가입된 이메일입니다. 로그인해 주세요.';
  if (message.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 합니다.';
  return message;
}

async function handleLogin(form, statusEl) {
  const client = assertSupabase();
  const email = form.email.value.trim();
  const password = form.password.value;

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    setStatus(statusEl, translateAuthError(error.message), true);
    return;
  }

  setStatus(statusEl, '로그인되었습니다. 이동 중…', false);
  window.location.href = loginRedirectUrl();
}

async function handleSignup(form, statusEl) {
  const client = assertSupabase();
  const email = form.email.value.trim();
  const password = form.password.value;

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    setStatus(statusEl, translateAuthError(error.message), true);
    return;
  }

  if (data.session) {
    setStatus(statusEl, '가입이 완료되었습니다. 게시판으로 이동합니다.', false);
    window.location.href = loginRedirectUrl();
    return;
  }

  setStatus(
    statusEl,
    '가입 확인 메일을 발송했습니다. 메일의 링크를 확인한 뒤 로그인해 주세요.',
    false
  );
}

function bindAuthForm() {
  const form = document.getElementById('auth-form');
  const statusEl = document.getElementById('auth-status');
  const mode = form?.dataset.authMode;
  if (!form || !mode) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(statusEl, '', false);
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (mode === 'login') await handleLogin(form, statusEl);
      else if (mode === 'signup') await handleSignup(form, statusEl);
    } catch (err) {
      setStatus(statusEl, err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function preserveRedirectOnLinks() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (!redirect || !redirect.startsWith('/')) return;
  const q = `?redirect=${encodeURIComponent(redirect)}`;
  document.getElementById('auth-signup-switch')?.setAttribute('href', `/signup.html${q}`);
  document.getElementById('auth-login-switch')?.setAttribute('href', `/login.html${q}`);
}

initMobileNav();
initAuthUI();
preserveRedirectOnLinks();
bindAuthForm();
