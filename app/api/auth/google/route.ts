import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google 로그인 시작은 일반 Route Handler로 처리한다. Next.js 16의 서버 액션은
// 완료 직후 현재 경로를 새로고침하려 하는데, 그 시점에 location이 이미 외부
// 주소(Supabase/Google)로 바뀌어 있으면 그 주소를 앱 내부 경로처럼 다시
// 불러오려다 실패해 로그인이 진행되지 않는다. Route Handler의 실제 HTTP
// 리다이렉트는 이 문제에서 자유롭다.
function isSafeNextPath(next: string | null): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//");
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next");
  const safeNext = isSafeNextPath(next) ? next : "/exhibits";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  return NextResponse.redirect(data.url);
}
