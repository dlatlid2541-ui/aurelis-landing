# Google Sheets 문의 연동

1. Google Sheets를 만들고 첫 시트 이름을 `inquiries`로 변경합니다.
2. 1행에 다음 헤더를 입력합니다:  
   `created_at`, `inquiry_id`, `type`, `product_interest`, `name`, `email`, `phone`, `company`, `message`, `privacy_consent`, `source_page`, `status`, `memo`
3. [Code.gs](./Code.gs) 내용을 Apps Script에 붙여넣고 `SPREADSHEET_ID`를 설정합니다.
4. **배포 > 새 배포 > 웹 앱**: 실행 주체「나」, 액세스「모든 사용자」.
5. 프로젝트 루트에 `.env` 파일을 만들고 `VITE_GAS_WEB_APP_URL`에 `/exec` URL을 넣습니다.
6. `npm run dev`를 재시작한 뒤 문의 폼을 테스트합니다.

**관리자 메일** 접수 시 `ADMIN_EMAIL`(기본 `dlatlid2541@gmail.com`)로 `MailApp.sendEmail` 알림이 발송됩니다.

### `MAIL_FAILED: script.send_mail` 권한 오류 해결

웹앱으로만 제출하면 **메일 권한이 한 번도 승인되지 않은** 경우가 많습니다. **편집기에서** 아래 순서를 진행하세요.

1. Apps Script 편집기에서 [Code.gs](./Code.gs) 저장
2. 상단 함수 선택 **`testAdminMail`** → **실행(▶)**
3. **권한 검토** → 스크립트를 만든 **Google 계정**(시트 소유 계정) 선택
4. **고급** → **(프로젝트명)(으)로 이동** → **허용**  
   (「이메일을 대신 보내기」/`script.send_mail` 포함)
5. **배포 → 배포 관리** → 웹 앱 **연필** → **버전: 새 버전** → **배포**  
   (권한 승인 **이후** 반드시 새 버전 배포)
6. `testAdminMail` 실행 후 **dlatlid2541@gmail.com** 수신 확인 → 랜딩에서 문의 재테스트

**웹 앱 배포 설정:** 실행 주체 **「나」**, 액세스 **「모든 사용자」**.  
「사용자가 웹 앱에 액세스하는 경우」로 실행하면 익명 방문자는 메일 권한을 줄 수 없어 실패합니다.

(선택) 프로젝트 설정 → **「appsscript.json」 매니페스트 파일 표시** → [appsscript.json](./appsscript.json)의 `oauthScopes` 참고.

시트 `memo`에 `MAIL_FAILED`가 남으면 위 2~5단계를 다시 확인하세요.

## 관리자 페이지 (`/admin.html`)

랜딩 문의를 시트에서 조회하고 **status**(상담 상태)·**memo**(내부 메모)를 수정합니다.  
헤더 이름 `status`, `memo` 열을 기준으로 저장합니다. (일반적으로 **L열=status**, **M열=memo** — K열은 `source_page`)

### 1. 관리자 토큰 설정 (Apps Script)

1. [Code.gs](./Code.gs)에서 `setAdminApiToken()` 함수 안 `'CHANGE_ME_TO_A_STRONG_SECRET'`을 **긴 임의 문자열**로 변경
2. 편집기에서 **`setAdminApiToken` 실행** (1회)
3. **Code.gs 전체 저장** → 웹 앱 **새 버전 배포**

### 2. 페이지 접속

- 로컬: `http://localhost:5173/admin.html`
- Vercel: `https://(도메인)/admin.html`
- 접속 후 위에서 설정한 **ADMIN_TOKEN** 입력 (세션 저장)

### 3. 상태 값

`NEW` · `IN_PROGRESS` · `REPLIED` · `CLOSED`

> 토큰은 프론트에 박아 두지 마세요. URL 유출 시 `/admin.html` 접근을 막으려면 Vercel 비밀번호 보호 등을 추가하세요.

CORS: 클라이언트는 `Content-Type: text/plain`으로 POST합니다. 필요 시 Apps Script에서 `doOptions`를 추가해 preflight를 처리하세요.
