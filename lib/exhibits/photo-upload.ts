import type { SupabaseClient } from "@supabase/supabase-js";

// 브라우저에서 Supabase Storage로 직접 업로드한다. 경로는 {userId}/{uuid}.{ext} 규칙을
// 따라야 storage RLS의 "자기 폴더" 정책과 맞는다.
export async function uploadExhibitPhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("exhibit-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error("사진 업로드에 실패했습니다.");
  }

  return path;
}
