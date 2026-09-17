import { Button } from "@/components/ui/button";

// 일반 <a> 태그로 브라우저 기본 이동을 쓴다. Next.js의 <Link>는 내부 경로로
// 여기고 RSC payload를 fetch로 먼저 받아보려 하는데, 이 경로는 실제로는 외부
// OAuth 주소로 HTTP 리다이렉트하므로 그 fetch가 CORS에 막혀 로그인이 진행되지
// 않는다. 평범한 링크 이동은 이 문제에서 자유롭다.
export function GoogleLoginButton({ next }: { next?: string }) {
  const href = next ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/api/auth/google";

  return (
    <Button className="w-full" render={<a href={href} />} nativeButton={false}>
      Google로 계속하기
    </Button>
  );
}
