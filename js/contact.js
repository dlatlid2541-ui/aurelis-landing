const form = document.getElementById('contact-form');
const submitBtn = document.getElementById('contact-submit');
const statusEl = document.getElementById('form-status');

const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';
if (!GAS_URL && import.meta.env.DEV) {
  console.warn('[contact] VITE_GAS_WEB_APP_URL 없음 → 제출 시 시뮬레이션만 됩니다.');
}
const formOpenedAt = Date.now();
const MIN_SUBMIT_MS = 3000;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripControlChars(str) {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function sanitize(str) {
  return stripControlChars(str.trim()).replace(/<[^>]*>/g, '');
}

function setFieldError(fieldWrap, message) {
  if (!fieldWrap) return;
  fieldWrap.classList.add('form-field--error');
  let err = fieldWrap.querySelector('.field-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    fieldWrap.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldErrors() {
  form?.querySelectorAll('.form-field--error').forEach((el) => {
    el.classList.remove('form-field--error');
  });
  form?.querySelectorAll('.field-error').forEach((el) => el.remove());
}

function showStatus(message, type) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `form-status is-visible form-status--${type}`;
}

function validateForm(data) {
  const errors = [];
  if (!data.type) errors.push({ id: 'inquiry-type', msg: '문의 유형을 선택해 주세요.' });
  if (data.name.length < 2 || data.name.length > 60) {
    errors.push({ id: 'contact-name', msg: '이름은 2–60자로 입력해 주세요.' });
  }
  if (!emailPattern.test(data.email)) {
    errors.push({ id: 'contact-email', msg: '올바른 이메일을 입력해 주세요.' });
  }
  if (data.message.length < 10 || data.message.length > 2000) {
    errors.push({ id: 'contact-message', msg: '문의 내용은 10–2,000자로 입력해 주세요.' });
  }
  if (!data.privacy_consent) {
    errors.push({ id: 'privacy-field', msg: '개인정보 수집·이용에 동의해 주세요.' });
  }
  return errors;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors();
  showStatus('', '');

  const honeypot = form.querySelector('#website')?.value?.trim();
  if (honeypot) return;

  if (Date.now() - formOpenedAt < MIN_SUBMIT_MS) {
    showStatus('잠시 후 다시 제출해 주세요.', 'error');
    return;
  }

  const payload = {
    type: sanitize(form.elements.type.value),
    product_interest: sanitize(form.elements.product_interest.value),
    name: sanitize(form.elements.name.value),
    email: sanitize(form.elements.email.value),
    phone: sanitize(form.elements.phone.value),
    company: sanitize(form.elements.company.value),
    message: sanitize(form.elements.message.value),
    privacy_consent: form.elements.privacy_consent.checked,
    source_page: window.location.pathname + window.location.search,
  };

  const errors = validateForm(payload);
  if (errors.length) {
    errors.forEach(({ id, msg }) => {
      const el = document.getElementById(id);
      const wrap = el?.classList?.contains('form-field')
        ? el
        : el?.closest('.form-field') || el?.closest('label')?.parentElement;
      setFieldError(wrap, msg);
    });
    showStatus('입력 내용을 확인해 주세요.', 'error');
    return;
  }

  submitBtn.disabled = true;

  try {
    if (GAS_URL) {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          ...payload,
          privacy_consent: true,
        }),
      });
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { ok: res.ok };
      }
      if (!res.ok || result.ok === false) {
        throw new Error(result.error || 'Submit failed');
      }
      form.reset();
      const idNote = result.inquiry_id ? ` (접수 ID: ${result.inquiry_id})` : '';
      showStatus(
        `문의가 접수되었습니다.${idNote} 영업일 기준 2–3일 내 연락드리겠습니다.`,
        'success'
      );
    } else {
      await new Promise((r) => setTimeout(r, 600));
      console.info('[데모] 문의 접수 시뮬레이션:', payload);
      form.reset();
      showStatus(
        '접수 시뮬레이션 완료입니다. Google Sheets 연동 시 .env에 VITE_GAS_WEB_APP_URL을 설정하세요.',
        'success'
      );
    }
  } catch (err) {
    console.error(err);
    const msg = String(err.message || err);
    if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
      showStatus(
        '서버에 연결하지 못했습니다. GAS 웹앱 URL·배포(모든 사용자)를 확인하거나, 페이지를 새로고침 후 3초 뒤 다시 제출해 주세요.',
        'error'
      );
    } else {
      showStatus(`제출 오류: ${msg}`, 'error');
    }
  } finally {
    submitBtn.disabled = false;
  }
});
