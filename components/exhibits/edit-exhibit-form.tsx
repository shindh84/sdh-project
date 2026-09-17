"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadExhibitPhoto } from "@/lib/exhibits/photo-upload";
import { updateExhibitAction } from "@/lib/exhibits/actions";
import type { PhotoCrop } from "@/lib/exhibits/types";
import { PhotoCropper } from "@/components/exhibits/photo-cropper";
import { ExhibitView } from "@/components/exhibits/exhibit-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export function EditExhibitForm({
  exhibitId,
  userId,
  initialTitle,
  initialDescription,
  initialShowStory,
  initialDisplayName,
  initialPhotoPath,
  initialPhotoUrl,
  initialCrop,
  story,
}: {
  exhibitId: string;
  userId: string;
  initialTitle: string;
  initialDescription: string;
  initialShowStory: boolean;
  initialDisplayName: string;
  initialPhotoPath: string;
  initialPhotoUrl: string;
  initialCrop: PhotoCrop;
  story: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [showStory, setShowStory] = useState(initialShowStory);
  const [displayName, setDisplayName] = useState(initialDisplayName);

  const [photoPath, setPhotoPath] = useState(initialPhotoPath);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(initialPhotoUrl);
  const [crop, setCrop] = useState<PhotoCrop>(initialCrop);
  const [uploading, setUploading] = useState(false);

  const [isSubmitting, startSubmitTransition] = useTransition();

  function handleFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    uploadExhibitPhoto(supabase, userId, file)
      .then((path) => setPhotoPath(path))
      .catch(() => toast.error("사진 업로드에 실패했습니다. 다시 시도해주세요."))
      .finally(() => setUploading(false));
  }

  function handleSave() {
    if (!title.trim() || !description.trim()) {
      toast.error("제목과 설명을 채워주세요.");
      return;
    }
    startSubmitTransition(async () => {
      const result = await updateExhibitAction({
        id: exhibitId,
        title,
        description,
        photoPath,
        photoCrop: crop,
        showStory,
        displayName: displayName.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("전시를 수정했습니다.");
      router.push(`/exhibits/${exhibitId}`);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="photo">사진</FieldLabel>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="mt-2 max-w-56">
            <PhotoCropper imageSrc={photoPreviewUrl} crop={crop} onCropChange={setCrop} />
            {uploading && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                <Spinner className="size-3" /> 업로드 중...
              </p>
            )}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="title">전시 제목</FieldLabel>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">전시 설명</FieldLabel>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="showStory">원래 사연 함께 보여주기</FieldLabel>
          <Switch id="showStory" checked={showStory} onCheckedChange={setShowStory} />
        </Field>

        <Field>
          <FieldLabel htmlFor="displayName">전시에 표시할 이름/별명</FieldLabel>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="비워두면 표시하지 않습니다"
          />
        </Field>

        <Button size="lg" disabled={isSubmitting || uploading} onClick={handleSave}>
          {isSubmitting && <Spinner />}
          저장하기
        </Button>
      </FieldGroup>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium">미리보기</p>
        <div className="overflow-hidden rounded-lg border">
          <ExhibitView
            title={title}
            description={description}
            photoUrl={photoPreviewUrl}
            photoCrop={crop}
            story={story}
            showStory={showStory}
            displayName={displayName || null}
          />
        </div>
      </div>
    </div>
  );
}
