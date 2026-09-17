import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fromRow, type Exhibit, type ExhibitRow } from "@/lib/exhibits/types";

const PHOTO_SIGNED_URL_TTL_SECONDS = 300; // data-and-auth 계약: 관람자용 사진 주소는 최대 5분.

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  return { id: data.claims.sub as string, email: data.claims.email as string | undefined };
}

// 로그인한 본인의 전시만 반환한다. RLS는 "링크 공유 중인 남의 전시"까지 허용하므로
// 내 전시관 목록에서는 owner_id로 한 번 더 좁혀야 한다.
export async function listMyExhibits(ownerId: string): Promise<Exhibit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exhibits")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ExhibitRow[]).map(fromRow);
}

// 존재 여부와 접근 권한을 구분하지 않는다: RLS가 막은 행은 그냥 없는 것처럼 반환된다.
// 나만 보기 전시를 남이 조회했을 때 "있는데 못 본다"가 아니라 "없다"로 보여야 한다.
export async function getExhibitById(id: string): Promise<Exhibit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exhibits")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return fromRow(data as ExhibitRow);
}

export async function getSignedPhotoUrl(photoPath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("exhibit-photos")
    .createSignedUrl(photoPath, PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}
