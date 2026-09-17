import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Components, Server Actions, Route Handlers에서 사용한다.
// Server Component 안에서는 쿠키를 쓸 수 없으므로 setAll이 실패할 수 있는데,
// proxy.ts가 매 요청마다 세션을 갱신해 주기 때문에 무시해도 안전하다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 무시한다.
          }
        },
      },
    },
  );
}
