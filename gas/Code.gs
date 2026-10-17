/**
 * AURÉLIS 문의 폼 → Google Sheets
 * 1. 새 Google Sheets에 inquiries 시트 생성 (아래 헤더 행)
 * 2. 확장 프로그램 > Apps Script에 이 코드 붙여넣기
 * 3. SPREADSHEET_ID 설정 후 배포 > 웹 앱 (execute as: Me, access: Anyone)
 * 4. .env에 VITE_GAS_WEB_APP_URL=배포 URL
 *
 * inquiries 시트 1행 헤더:
 * created_at | inquiry_id | type | product_interest | name | email | phone | company | message | privacy_consent | source_page | status | memo
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'inquiries';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.website) {
      return jsonResponse({ ok: false, error: 'Rejected' });
    }

    const type = sanitize_(body.type);
    const name = sanitize_(body.name);
    const email = sanitize_(body.email);
    const message = sanitize_(body.message);

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

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const inquiryId = Utilities.getUuid().slice(0, 8);
    const row = [
      new Date(),
      inquiryId,
      type,
      sanitize_(body.product_interest || ''),
      name,
      email,
      sanitize_(body.phone || ''),
      sanitize_(body.company || ''),
      message,
      'true',
      sanitize_(body.source_page || ''),
      'NEW',
      '',
    ];
    sheet.appendRow(row);

    return jsonResponse({ ok: true, inquiry_id: inquiryId });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Server error' });
  }
}

function doGet() {
  return ContentService.createTextOutput('AURÉLIS inquiry endpoint');
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
