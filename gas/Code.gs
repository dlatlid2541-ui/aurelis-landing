/**
 * AURÉLIS 문의 폼 → Google Sheets + 관리자 메일 + 관리자 API
 * 배포: execute as Me, access Anyone — 수정 후 새 버전 배포
 *
 * inquiries 1행 헤더:
 * created_at | inquiry_id | type | product_interest | name | email | phone | company | message | privacy_consent | source_page | status | memo
 *
 * 관리자 API (POST JSON):
 * - action: admin_list  + admin_token
 * - action: admin_update + admin_token + inquiry_id + status? + memo?
 *
 * 최초 1회: setAdminApiToken() 실행 후 Properties에 저장된 토큰을 admin 페이지에 입력
 */

const SPREADSHEET_ID = '1IYKehzwpsF1G_Ntd1Znk3vWf0NLEzMfaBfCPFDBXt3M';
const SHEET_NAME = 'inquiries';
const ADMIN_EMAIL = 'dlatlid2541@gmail.com';
const ALLOWED_STATUSES = ['NEW', 'IN_PROGRESS', 'REPLIED', 'CLOSED'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'admin_list') {
      return handleAdminList_(body);
    }
    if (body.action === 'admin_update') {
      return handleAdminUpdate_(body);
    }

    if (body.website) {
      return jsonResponse({ ok: false, error: 'Rejected' });
    }

    const type = sanitize_(body.type);
    const name = sanitize_(body.name);
    const email = sanitize_(body.email);
    const message = sanitize_(body.message);
    const productInterest = sanitize_(body.product_interest || '');
    const phone = sanitize_(body.phone || '');
    const company = sanitize_(body.company || '');
    const sourcePage = sanitize_(body.source_page || '');

    if (!type || !name || name.length < 2 || name.length > 60) {
      return jsonResponse({ ok: false, error: 'Invalid name or type' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, error: 'Invalid email' });
    }
    if (!message || message.length < 10 || message.length > 2000) {
      return jsonResponse({ ok: false, error: 'Invalid message' });
    }
    if (body.privacy_consent !== true) {
      return jsonResponse({ ok: false, error: 'Consent required' });
    }

    const sheet = getInquiriesSheet_();
    ensureSheetHeaders_(sheet);
    const cols = getColumnMap_(sheet);
    if (!cols.inquiry_id) {
      return jsonResponse({
        ok: false,
        error: 'Sheet header mismatch: 접수ID or inquiry_id column required in row 1',
      });
    }
    const inquiryId = Utilities.getUuid().slice(0, 8);
    const rowIndex = appendInquiryRow_(sheet, cols, {
      inquiryId: inquiryId,
      type: type,
      productInterest: productInterest,
      name: name,
      email: email,
      phone: phone,
      company: company,
      message: message,
      sourcePage: sourcePage,
    });

    let mailSent = false;
    try {
      notifyAdminEmail_({
        inquiryId: inquiryId,
        type: type,
        productInterest: productInterest,
        name: name,
        email: email,
        phone: phone,
        company: company,
        message: message,
        sourcePage: sourcePage,
      });
      mailSent = true;
    } catch (mailErr) {
      const errText = String(mailErr.message || mailErr);
      console.error('Admin mail failed:', mailErr);
      if (cols.memo) {
        sheet.getRange(rowIndex, cols.memo).setValue('MAIL_FAILED: ' + errText.slice(0, 200));
      }
    }

    return jsonResponse({ ok: true, inquiry_id: inquiryId, mail_sent: mailSent, admin_email: ADMIN_EMAIL });
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ ok: false, error: 'Server error: ' + String(err.message || err) });
  }
}

var HEADER_ROW_ = [
  'created_at',
  'inquiry_id',
  'type',
  'product_interest',
  'name',
  'email',
  'phone',
  'company',
  'message',
  'privacy_consent',
  'source_page',
  'status',
  'memo',
];

function ensureSheetHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW_);
  }
}

function appendInquiryRow_(sheet, cols, data) {
  if (cols.inquiry_id) {
    var row = buildEmptyRow_(cols);
    setField_(row, cols, 'created_at', new Date());
    setField_(row, cols, 'inquiry_id', data.inquiryId);
    setField_(row, cols, 'type', data.type);
    setField_(row, cols, 'product_interest', data.productInterest);
    setField_(row, cols, 'name', data.name);
    setField_(row, cols, 'email', data.email);
    setField_(row, cols, 'phone', data.phone);
    setField_(row, cols, 'company', data.company);
    setField_(row, cols, 'message', data.message);
    setField_(row, cols, 'privacy_consent', 'true');
    setField_(row, cols, 'source_page', data.sourcePage);
    setField_(row, cols, 'status', 'NEW');
    setField_(row, cols, 'memo', '');
    sheet.appendRow(row);
  } else {
    sheet.appendRow([
      new Date(),
      data.inquiryId,
      data.type,
      data.productInterest,
      data.name,
      data.email,
      data.phone,
      data.company,
      data.message,
      'true',
      data.sourcePage,
      'NEW',
      '',
    ]);
  }
  return sheet.getLastRow();
}

function handleAdminList_(body) {
  if (!validateAdminToken_(body.admin_token)) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }
  const sheet = getInquiriesSheet_();
  const cols = getColumnMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ ok: true, inquiries: [], statuses: ALLOWED_STATUSES });
  }

  const width = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow, width).getValues();
  const inquiries = values
    .map(function (row, idx) {
      return rowToInquiry_(row, cols, idx + 2);
    })
    .filter(function (item) {
      return item.inquiry_id || item.name || item.email;
    })
    .reverse();

  return jsonResponse({
    ok: true,
    inquiries: inquiries,
    statuses: ALLOWED_STATUSES,
    meta: {
      sheet_rows: lastRow - 1,
      has_inquiry_id_column: !!cols.inquiry_id,
    },
  });
}

function handleAdminUpdate_(body) {
  if (!validateAdminToken_(body.admin_token)) {
    return jsonResponse({ ok: false, error: 'Unauthorized' });
  }

  const inquiryId = sanitize_(body.inquiry_id);
  if (!inquiryId) {
    return jsonResponse({ ok: false, error: 'Missing inquiry_id' });
  }

  const sheet = getInquiriesSheet_();
  const cols = getColumnMap_(sheet);
  if (!cols.inquiry_id) {
    return jsonResponse({ ok: false, error: 'Sheet missing inquiry_id column' });
  }

  const rowIndex = findRowByInquiryId_(sheet, cols.inquiry_id, inquiryId);
  if (rowIndex < 0) {
    return jsonResponse({ ok: false, error: 'Inquiry not found' });
  }

  if (body.status !== undefined && body.status !== null && String(body.status) !== '') {
    const status = String(body.status).trim().toUpperCase();
    if (ALLOWED_STATUSES.indexOf(status) === -1) {
      return jsonResponse({ ok: false, error: 'Invalid status' });
    }
    if (!cols.status) {
      return jsonResponse({ ok: false, error: 'Sheet missing status column' });
    }
    sheet.getRange(rowIndex, cols.status).setValue(status);
  }

  if (body.memo !== undefined) {
    const memo = sanitize_(body.memo).slice(0, 2000);
    if (!cols.memo) {
      return jsonResponse({ ok: false, error: 'Sheet missing memo column' });
    }
    sheet.getRange(rowIndex, cols.memo).setValue(memo);
  }

  const row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updated = rowToInquiry_(row, cols, rowIndex);
  return jsonResponse({ ok: true, inquiry: updated });
}

function rowToInquiry_(row, cols, rowIndex) {
  function cell(key) {
    const col = cols[key];
    if (!col) return '';
    const val = row[col - 1];
    if (val instanceof Date) {
      return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    }
    return val === null || val === undefined ? '' : String(val);
  }
  var inquiryId = cell('inquiry_id');
  if (!inquiryId && rowIndex) {
    inquiryId = 'row-' + rowIndex;
  }
  return {
    row_index: rowIndex,
    created_at: cell('created_at'),
    inquiry_id: inquiryId,
    type: cell('type'),
    product_interest: cell('product_interest'),
    name: cell('name'),
    email: cell('email'),
    phone: cell('phone'),
    company: cell('company'),
    message: cell('message'),
    privacy_consent: cell('privacy_consent'),
    source_page: cell('source_page'),
    status: cell('status') || 'NEW',
    memo: cell('memo'),
  };
}

function findRowByInquiryId_(sheet, idCol, inquiryId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, idCol, lastRow, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === inquiryId) {
      return i + 2;
    }
  }
  return -1;
}

var HEADER_ALIASES_ = {
  created_at: ['created_at', '접수시각', '접수 시각'],
  inquiry_id: ['inquiry_id', '접수id', '접수 id'],
  type: ['type', '문의유형', '문의 유형'],
  product_interest: ['product_interest', '관심제품', '관심 제품'],
  name: ['name', '이름'],
  email: ['email', '회신 e-mail', '회신 email', '회신e-mail', '이메일'],
  phone: ['phone', '연락처'],
  company: ['company', '회사명'],
  message: ['message', '본문', '문의 내용'],
  privacy_consent: ['privacy_consent', '동의여부', '동의 여부'],
  source_page: ['source_page', '제출페이지 경로', '제출 페이지 경로', 'source page'],
  status: ['status', '처리상태', '처리 상태'],
  memo: ['memo', '내부메모', '내부 메모'],
};

function normalizeHeaderKey_(header) {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getColumnMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach(function (h, i) {
    const norm = normalizeHeaderKey_(h);
    if (!norm) return;
    Object.keys(HEADER_ALIASES_).forEach(function (canonical) {
      HEADER_ALIASES_[canonical].forEach(function (alias) {
        if (norm === normalizeHeaderKey_(alias)) {
          map[canonical] = i + 1;
        }
      });
    });
  });
  return map;
}

function buildEmptyRow_(cols) {
  var maxCol = 0;
  Object.keys(cols).forEach(function (k) {
    if (cols[k] > maxCol) maxCol = cols[k];
  });
  var row = [];
  for (var c = 0; c < maxCol; c++) row.push('');
  return row;
}

function setField_(row, cols, key, value) {
  if (!cols[key]) return;
  row[cols[key] - 1] = value;
}

function getInquiriesSheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

function validateAdminToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  if (!expected) return false;
  return sanitize_(token) === expected;
}

/** 편집기에서 1회 실행: 관리자 API 토큰 설정 (아래 문자열을 원하는 값으로 바꾼 뒤 실행) */
function setAdminApiToken() {
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', 'CHANGE_ME_TO_A_STRONG_SECRET');
}

function notifyAdminEmail_(data) {
  const subject = '[AURÉLIS] 새 문의 접수 (' + data.inquiryId + ') — ' + data.type;
  const lines = [
    'AURÉLIS 랜딩페이지에 새 문의가 접수되었습니다.',
    '',
    '접수 ID: ' + data.inquiryId,
    '문의 유형: ' + data.type,
    '관심 제품: ' + (data.productInterest || '(없음)'),
    '이름: ' + data.name,
    '이메일: ' + data.email,
    '연락처: ' + (data.phone || '(없음)'),
    '회사명: ' + (data.company || '(없음)'),
    '접수 경로: ' + (data.sourcePage || '(없음)'),
    '',
    '—— 문의 내용 ——',
    data.message,
    '',
    '관리자 페이지에서 status/memo를 갱신해 주세요.',
  ];
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    body: lines.join('\n'),
    replyTo: data.email,
    name: 'AURÉLIS 문의 알림',
  });
}

function doGet() {
  return ContentService.createTextOutput('AURÉLIS inquiry + admin API endpoint');
}

function testAdminMail() {
  notifyAdminEmail_({
    inquiryId: 'TEST0000',
    type: '테스트',
    productInterest: '',
    name: '테스트 사용자',
    email: 'test@example.com',
    phone: '',
    company: '',
    message: '관리자 메일 테스트입니다.',
    sourcePage: '/test',
  });
}

function sanitize_(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
