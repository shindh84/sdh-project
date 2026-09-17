# Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. **Project Settings → Data API**에서 Project URL과 anon/publishable key를 확인해 `.env.local`에 넣습니다 (`.env.example` 참고).
3. **Authentication → Sign In / Providers → Google**을 켜고 Client ID/Secret을 등록합니다.
4. 그 화면의 Callback URL을 Google Cloud Console OAuth 클라이언트의 승인된 리디렉션 URI에 추가합니다.
5. **Authentication → URL Configuration**에서 Site URL을 개발 중인 주소(`http://localhost:3000`)로 설정합니다.
6. **SQL Editor**에서 [`schema.sql`](./schema.sql) 전체를 붙여넣고 실행합니다. 이 저장소에는 로컬 Supabase CLI나 마이그레이션 워크플로를 두지 않습니다.
