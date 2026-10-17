# AURÉLIS 코스메틱 랜딩페이지

프레스티지 더마 브랜드 **AURÉLIS** 단일 스크롤 MVP입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 표시된 로컬 주소(기본 `http://localhost:5173`)로 접속합니다.

### 주요 페이지

| 페이지 | URL |
|--------|-----|
| 홈 | http://localhost:5173/ |
| 로그인 | http://localhost:5173/login.html |
| 회원가입 | http://localhost:5173/signup.html |
| 게시판 | http://localhost:5173/board.html |

## 회원·게시판 (Supabase)

[supabase/README.md](supabase/README.md) — DB SQL, `.env` 키, **Confirm email** 실습용 설정(OFF 권장).

`.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 없으면 로그인·게시판은 동작하지 않습니다.

## 빌드

```bash
npm run build
npm run preview
```

## 문의 폼 (Google Sheets)

[gas/README.md](gas/README.md)를 참고해 Apps Script를 배포한 뒤, `.env`에 `VITE_GAS_WEB_APP_URL`을 설정하세요. URL이 없으면 제출 시 **시뮬레이션**으로 동작합니다.

## 관리자 페이지

[admin.html](admin.html) — 시트 문의 목록, **status** / **memo** 수정.  
설정 방법: [gas/README.md](gas/README.md) 「관리자 페이지」 섹션.

## 자산

`reference/` 폴더의 이미지·영상은 `public/assets/`에 복사되어 있습니다.
