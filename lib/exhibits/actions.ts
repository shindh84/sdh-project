"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateExhibitCopy, type ExhibitCopy } from "@/lib/ai/generate-exhibit-copy";
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

export async function deleteExhibitAction(id: string): Promise<void> {
  await requireUserId();
  const supabase = await createClient();
  await supabase.from("exhibits").delete().eq("id", id);
  redirect("/exhibits");
}
