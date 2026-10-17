# Google Sheets 문의 연동

1. Google Sheets를 만들고 첫 시트 이름을 `inquiries`로 변경합니다.
2. 1행에 다음 헤더를 입력합니다:  
   `created_at`, `inquiry_id`, `type`, `product_interest`, `name`, `email`, `phone`, `company`, `message`, `privacy_consent`, `source_page`, `status`, `memo`
3. [Code.gs](./Code.gs) 내용을 Apps Script에 붙여넣고 `SPREADSHEET_ID`를 설정합니다.
4. **배포 > 새 배포 > 웹 앱**: 실행 주체「나」, 액세스「모든 사용자」.
5. 프로젝트 루트에 `.env` 파일을 만들고 `VITE_GAS_WEB_APP_URL`에 `/exec` URL을 넣습니다.
6. `npm run dev`를 재시작한 뒤 문의 폼을 테스트합니다.

CORS: 클라이언트는 `Content-Type: text/plain`으로 POST합니다. 필요 시 Apps Script에서 `doOptions`를 추가해 preflight를 처리하세요.
