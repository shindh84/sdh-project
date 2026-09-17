"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateExhibitCopy, type ExhibitCopy } from "@/lib/ai/generate-exhibit-copy";
import { retouchExhibitPhoto } from "@/lib/ai/retouch-exhibit-photo";
import { getSignedPhotoUrl } from "@/lib/exhibits/queries";
import { DEFAULT_PHOTO_CROP, type Mood, type PhotoCrop, type Visibility } from "@/lib/exhibits/types";

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) throw new Error("로그인이 필요합니다.");
  return sub as string;
}

export type GenerateCopyInput = {
  itemName: string;
  story: string;
  mood: Mood;
  period?: string;
  feature?: string;
};

export async function generateCopyAction(
  input: GenerateCopyInput,
): Promise<{ ok: true; copy: ExhibitCopy } | { ok: false; error: string }> {
  await requireUserId();

  if (!input.itemName.trim() || !input.story.trim()) {
    return { ok: false, error: "물건 이름과 사연을 먼저 입력해주세요." };
  }

  try {
    const copy = await generateExhibitCopy(input);
    return { ok: true, copy };
  } catch (error) {
    console.error("generateCopyAction failed:", error);
    return {
      ok: false,
      error: "문구 생성에 실패했습니다. 입력한 내용은 그대로 남아있으니 다시 시도해주세요.",
    };
  }
}

export type RetouchPhotoResult =
  | { ok: true; photoPath: string; photoUrl: string; styleLabel: string }
  | { ok: false; error: string };

// retouch-exhibit-photo 스펙: 원본 사진은 그대로 두고, 보정 결과를 새 파일로 만들어 돌려준다.
// 어느 쪽을 쓸지는 사용자가 미리보기에서 고른다.
export async function retouchExhibitPhotoAction(
  originalPhotoPath: string,
): Promise<RetouchPhotoResult> {
  const ownerId = await requireUserId();
  const supabase = await createClient();

  const { data: original, error: downloadError } = await supabase.storage
    .from("exhibit-photos")
    .download(originalPhotoPath);

  if (downloadError || !original) {
    return { ok: false, error: "원본 사진을 불러오지 못했습니다. 다시 시도해주세요." };
  }

  try {
    const mediaType = original.type || "image/jpeg";
    const imageBytes = new Uint8Array(await original.arrayBuffer());

    const retouched = await retouchExhibitPhoto({ imageBytes, mediaType });
    const ext = retouched.mediaType.split("/")[1] || "png";
    const newPath = `${ownerId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("exhibit-photos")
      .upload(newPath, Buffer.from(retouched.imageBytes), {
        contentType: retouched.mediaType,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: "보정 결과를 저장하지 못했습니다. 다시 시도해주세요." };
    }

    const photoUrl = await getSignedPhotoUrl(newPath);
    if (!photoUrl) {
      return { ok: false, error: "보정 결과를 불러오지 못했습니다. 다시 시도해주세요." };
    }

    return {
      ok: true,
      photoPath: newPath,
      photoUrl,
      styleLabel: retouched.styleLabel,
    };
  } catch (error) {
    console.error("retouchExhibitPhotoAction failed:", error);
    return {
      ok: false,
      error: "사진 보정에 실패했습니다. 원본 사진은 그대로 있으니 다시 시도해주세요.",
    };
  }
}

export type CreateExhibitInput = {
  photoPath: string;
  photoCrop?: PhotoCrop;
  itemName: string;
  story: string;
  mood: Mood;
  title: string;
  description: string;
  showStory: boolean;
  displayName: string | null;
};

export async function createExhibitAction(
  input: CreateExhibitInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ownerId = await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exhibits")
    .insert({
      owner_id: ownerId,
      item_name: input.itemName,
      story: input.story,
      mood: input.mood,
      title: input.title,
      description: input.description,
      photo_path: input.photoPath,
      photo_crop: input.photoCrop ?? DEFAULT_PHOTO_CROP,
      show_story: input.showStory,
      display_name: input.displayName?.trim() || null,
      visibility: "private",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "전시를 저장하지 못했습니다. 다시 시도해주세요." };
  }

  return { ok: true, id: data.id as string };
}

export type UpdateExhibitInput = {
  id: string;
  title: string;
  description: string;
  photoPath: string;
  photoCrop?: PhotoCrop;
  showStory: boolean;
  displayName: string | null;
};

export async function updateExhibitAction(
  input: UpdateExhibitInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exhibits")
    .update({
      title: input.title,
      description: input.description,
      photo_path: input.photoPath,
      photo_crop: input.photoCrop ?? DEFAULT_PHOTO_CROP,
      show_story: input.showStory,
      display_name: input.displayName?.trim() || null,
    })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "수정 권한이 없거나 저장에 실패했습니다." };
  }

  return { ok: true };
}

export async function setVisibilityAction(
  id: string,
  visibility: Visibility,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exhibits")
    .update({ visibility })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "공개 범위를 바꾸지 못했습니다." };
  }

  return { ok: true };
}

export async function deleteExhibitAction(
  id: string,
): Promise<{ ok: false; error: string } | void> {
  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("exhibits").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "삭제하지 못했습니다. 다시 시도해주세요." };
  }

  redirect("/exhibits");
}
