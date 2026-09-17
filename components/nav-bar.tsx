import Link from "next/link";
import { getCurrentUser } from "@/lib/exhibits/queries";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="border-border/60 border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          평범한 물건 박물관
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/exhibits" />} nativeButton={false}>
                내 전시관
              </Button>
              <form action={signOutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  로그아웃
                </Button>
              </form>
            </>
          ) : (
            <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
              로그인
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
