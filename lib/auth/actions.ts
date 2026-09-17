"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function isSafeNextPath(next: string | null | undefined): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//");
}

export async function signInWithGoogleAction(next?: string) {
  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? headerList.get("x-forwarded-host");
  const safeNext = isSafeNextPath(next) ? next : "/exhibits";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error || !data.url) {
    throw new Error("Google 로그인을 시작하지 못했습니다.");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
