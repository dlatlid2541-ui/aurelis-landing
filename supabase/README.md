# Supabase 회원·게시판 설정

## 1. 프로젝트 생성

[Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 만듭니다.

## 2. 데이터베이스

**SQL Editor**에서 [`schema.sql`](./schema.sql) 전체를 실행합니다.

## 3. 환경 변수

프로젝트 루트 `.env` (`.env.example` 참고):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

값은 **Project Settings → API**에서 확인합니다.

## 4. 이메일 확인 (Confirm email)

**Authentication → Providers → Email**

| 설정 | 실습용 (권장) | 운영/보안 강화 |
|------|----------------|----------------|
| **Confirm email** | **OFF** — 가입 직후 바로 로그인 | **ON** — 확인 메일 링크 클릭 후 로그인 |

- **OFF**: 회원가입 후 곧바로 게시판까지 테스트할 수 있습니다.
- **ON**: 가입 시 안내 문구대로 메일함에서 링크를 눌러야 합니다.  
  **Authentication → URL Configuration**에 사이트 URL을 추가하세요.  
  예: `http://localhost:5173`, 배포 URL이 있으면 함께 등록.

## 5. 로컬 실행

```bash
npm install
npm run dev
```

- [홈](http://localhost:5173/)
- [로그인](http://localhost:5173/login.html)
- [회원가입](http://localhost:5173/signup.html)
- [게시판](http://localhost:5173/board.html) (로그인 필요)
