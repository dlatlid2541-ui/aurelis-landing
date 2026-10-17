const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';
const TOKEN_KEY = 'aurelis_admin_token';

const authPanel = document.getElementById('auth-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const btnLogout = document.getElementById('btn-logout');
const btnRefresh = document.getElementById('btn-refresh');
const filterStatus = document.getElementById('filter-status');
const filterSearch = document.getElementById('filter-search');
const tbody = document.getElementById('inquiries-tbody');
const cardsRoot = document.getElementById('inquiries-cards');
const listStatus = document.getElementById('list-status');

let allInquiries = [];
let statusOptions = ['NEW', 'IN_PROGRESS', 'REPLIED', 'CLOSED'];

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function gasPost(payload) {
  if (!GAS_URL) throw new Error('VITE_GAS_WEB_APP_URL이 설정되지 않았습니다.');
  const res = await fetch(GAS_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('API 응답을 해석할 수 없습니다.');
  }
  if (!data.ok) throw new Error(data.error || '요청 실패');
  return data;
}

function showAuthError(msg) {
  authError.textContent = msg;
  authError.hidden = !msg;
}

function setAuthed(authed) {
  authPanel.hidden = authed;
  dashboardPanel.hidden = !authed;
  btnLogout.hidden = !authed;
}

function populateStatusFilter() {
  const current = filterStatus.value;
  filterStatus.innerHTML = '<option value="">전체</option>';
  statusOptions.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    filterStatus.appendChild(opt);
  });
  filterStatus.value = current;
}

function filteredInquiries() {
  const q = filterSearch.value.trim().toLowerCase();
  const st = filterStatus.value;
  return allInquiries.filter((item) => {
    if (st && item.status !== st) return false;
    if (!q) return true;
    const hay = [item.inquiry_id, item.name, item.email, item.type, item.product_interest]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

function statusSelect(id, value) {
  const sel = document.createElement('select');
  sel.className = 'admin-select';
  sel.dataset.inquiryId = id;
  sel.dataset.field = 'status';
  statusOptions.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === value) opt.selected = true;
    sel.appendChild(opt);
  });
  return sel;
}

function memoInput(id, value) {
  const ta = document.createElement('textarea');
  ta.className = 'admin-memo';
  ta.dataset.inquiryId = id;
  ta.dataset.field = 'memo';
  ta.value = value || '';
  return ta;
}

function saveButton(id) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary btn-sm';
  btn.textContent = '저장';
  btn.dataset.inquiryId = id;
  btn.addEventListener('click', () => saveInquiry(id, btn));
  return btn;
}

async function saveInquiry(inquiryId, btn) {
  const root = btn.closest('tr') || btn.closest('.admin-inquiry-card');
  const statusEl = root?.querySelector('[data-field="status"]');
  const memoEl = root?.querySelector('[data-field="memo"]');
  const msgEl = btn.parentElement.querySelector('.admin-save-msg');

  btn.disabled = true;
  if (msgEl) msgEl.textContent = '저장 중…';

  try {
    const data = await gasPost({
      action: 'admin_update',
      admin_token: getToken(),
      inquiry_id: inquiryId,
      status: statusEl?.value,
      memo: memoEl?.value ?? '',
    });
    const idx = allInquiries.findIndex((i) => i.inquiry_id === inquiryId);
    if (idx >= 0) allInquiries[idx] = data.inquiry;
    if (msgEl) msgEl.textContent = '저장됨';
  } catch (err) {
    if (msgEl) msgEl.textContent = err.message || '저장 실패';
  } finally {
    btn.disabled = false;
  }
}

function render() {
  const items = filteredInquiries();
  listStatus.textContent = `총 ${items.length}건 (전체 ${allInquiries.length}건)`;
  tbody.innerHTML = '';
  cardsRoot.innerHTML = '';

  if (allInquiries.length === 0) {
    listStatus.textContent =
      '표시할 문의가 없습니다. Google Sheets의 inquiries 탭 2행 이상에 데이터가 있는지, 1행 헤더에 inquiry_id 열이 있는지 확인하세요.';
    return;
  }

  if (items.length === 0) {
    listStatus.textContent = '필터 조건에 맞는 문의가 없습니다. 상태·검색 필터를 초기화해 보세요.';
    return;
  }

  items.forEach((item) => {
    const tr = document.createElement('tr');
    const tdSave = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.appendChild(saveButton(item.inquiry_id));
    const saveMsg = document.createElement('p');
    saveMsg.className = 'admin-save-msg';
    wrap.appendChild(saveMsg);
    tdSave.appendChild(wrap);

    tr.innerHTML = `
      <td>${escapeHtml(item.created_at)}</td>
      <td><code>${escapeHtml(item.inquiry_id)}</code></td>
      <td>${escapeHtml(item.type)}<div class="admin-cell-message">${escapeHtml(item.product_interest || '')}</div></td>
      <td>${escapeHtml(item.name)}</td>
      <td class="admin-cell-contact">${escapeHtml(item.email)}<br/>${escapeHtml(item.phone || '')}</td>
    `;
    const tdStatus = document.createElement('td');
    tdStatus.appendChild(statusSelect(item.inquiry_id, item.status));
    const tdMemo = document.createElement('td');
    tdMemo.appendChild(memoInput(item.inquiry_id, item.memo));
    const msgPreview = document.createElement('div');
    msgPreview.className = 'admin-cell-message';
    msgPreview.textContent = item.message || '';
    tdMemo.appendChild(msgPreview);
    tr.appendChild(tdStatus);
    tr.appendChild(tdMemo);
    tr.appendChild(tdSave);
    tbody.appendChild(tr);

    const card = document.createElement('article');
    card.className = 'admin-inquiry-card';
    card.innerHTML = `
      <div class="admin-inquiry-card__head">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="admin-inquiry-card__meta">${escapeHtml(item.created_at)} · ${escapeHtml(item.inquiry_id)}</span>
      </div>
      <div class="admin-inquiry-card__body">
        <p><strong>${escapeHtml(item.type)}</strong> ${escapeHtml(item.product_interest || '')}</p>
        <p class="admin-cell-contact">${escapeHtml(item.email)} ${item.phone ? ' · ' + escapeHtml(item.phone) : ''}</p>
        <p class="admin-cell-message">${escapeHtml(item.message)}</p>
      </div>
    `;
    const body = card.querySelector('.admin-inquiry-card__body');
    body.appendChild(statusSelect(item.inquiry_id, item.status));
    body.appendChild(memoInput(item.inquiry_id, item.memo));
    const mobWrap = document.createElement('div');
    mobWrap.appendChild(saveButton(item.inquiry_id));
    const mobMsg = document.createElement('p');
    mobMsg.className = 'admin-save-msg';
    mobWrap.appendChild(mobMsg);
    body.appendChild(mobWrap);
    cardsRoot.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function loadInquiries() {
  listStatus.textContent = '불러오는 중…';
  try {
    const data = await gasPost({ action: 'admin_list', admin_token: getToken() });
    allInquiries = data.inquiries || [];
    statusOptions = data.statuses || statusOptions;
    populateStatusFilter();
    render();
  } catch (err) {
    if (err.message === 'Unauthorized') {
      setToken('');
      setAuthed(false);
      showAuthError(
        '토큰이 올바르지 않습니다. Apps Script에서 setAdminApiToken() 실행 후, 저장된 ADMIN_TOKEN과 동일하게 입력하세요.'
      );
      listStatus.textContent = '';
    } else if (err.message.includes('설정되지 않았')) {
      setAuthed(false);
      showAuthError(err.message);
      listStatus.textContent = '';
    } else {
      listStatus.textContent = err.message || '목록을 불러오지 못했습니다.';
    }
    throw err;
  }
}

authForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showAuthError('');
  const token = document.getElementById('admin-token').value.trim();
  setToken(token);
  try {
    await loadInquiries();
    setAuthed(true);
    showAuthError('');
  } catch (err) {
    if (err.message !== 'Unauthorized' && !authError.textContent) {
      setToken('');
      showAuthError(err.message || '인증에 실패했습니다.');
    }
  }
});

btnLogout?.addEventListener('click', () => {
  setToken('');
  setAuthed(false);
  showAuthError('');
  authForm.reset();
});

btnRefresh?.addEventListener('click', loadInquiries);
filterStatus?.addEventListener('change', render);
filterSearch?.addEventListener('input', render);

if (getToken()) {
  setAuthed(true);
  loadInquiries();
}
