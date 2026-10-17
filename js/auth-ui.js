import { assertSupabase, isSupabaseConfigured, supabase } from './supabaseClient.js';

const BOARD_PATH = '/board.html';
const LOGIN_PATH = '/login.html';

function boardLinks() {
  return document.querySelectorAll('[data-board-link]');
}

function loginRedirectUrl() {
  const path = window.location.pathname;
  if (path.endsWith('login.html') || path.endsWith('signup.html')) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    return redirect && redirect.startsWith('/') ? redirect : BOARD_PATH;
  }
  return `${path}${window.location.search}${window.location.hash}`;
}

export async function getSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error(error);
    return null;
  }
  return data.session;
}

export async function requireAuth({ redirectToLogin = true } = {}) {
  const session = await getSession();
  if (session) return session;
  if (redirectToLogin) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${LOGIN_PATH}?redirect=${next}`;
  }
  return null;
}

function setHeaderAuth(session) {
  const loginBtn = document.getElementById('auth-login-btn');
  const signupBtn = document.getElementById('auth-signup-btn');
  const userWrap = document.getElementById('auth-user-wrap');
  const userEmail = document.getElementById('auth-user-email');
  const logoutBtn = document.getElementById('auth-logout-btn');

  const loggedIn = Boolean(session?.user);

  loginBtn?.classList.toggle('is-hidden', loggedIn);
  signupBtn?.classList.toggle('is-hidden', loggedIn);
  userWrap?.classList.toggle('is-hidden', !loggedIn);

  if (loggedIn && userEmail) {
    userEmail.textContent = session.user.email ?? '회원';
  }

}

let sessionRef = null;
let boardGuardBound = false;

function bindBoardGuardOnce() {
  if (boardGuardBound) return;
  boardGuardBound = true;
  boardLinks().forEach((link) => {
    link.addEventListener('click', (event) => {
      if (sessionRef?.user) return;
      event.preventDefault();
      const redirect = encodeURIComponent(BOARD_PATH);
      window.location.href = `${LOGIN_PATH}?redirect=${redirect}`;
    });
  });
}

function bindLogoutOnce() {
  const logoutBtn = document.getElementById('auth-logout-btn');
  if (!logoutBtn || logoutBtn.dataset.bound === 'true') return;
  logoutBtn.dataset.bound = 'true';
  logoutBtn.addEventListener('click', async () => {
    try {
      assertSupabase();
      await supabase.auth.signOut();
      window.location.href = '/index.html';
    } catch (err) {
      alert(err.message);
    }
  });
}

export async function initAuthUI() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  sessionRef = session;
  setHeaderAuth(session);
  bindBoardGuardOnce();
  bindLogoutOnce();

  if (isSupabaseConfigured && supabase) {
    supabase.auth.onAuthStateChange((_event, nextSession) => {
      sessionRef = nextSession;
      setHeaderAuth(nextSession);
    });
  }
}

export { LOGIN_PATH, loginRedirectUrl };
