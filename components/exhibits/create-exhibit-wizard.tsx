"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadExhibitPhoto } from "@/lib/exhibits/photo-upload";
import { createExhibitAction, generateCopyAction } from "@/lib/exhibits/actions";
import {
  DEFAULT_MOOD,
  DEFAULT_PHOTO_CROP,
  MOOD_LABEL,
  MOODS,
  type Mood,
  type PhotoCrop,
} from "@/lib/exhibits/types";
import { PhotoCropper } from "@/components/exhibits/photo-cropper";
import { PhotoRetouch } from "@/components/exhibits/photo-retouch";
import { ExhibitView } from "@/components/exhibits/exhibit-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCwIcon } from "lucide-react";

type Phase = "input" | "compose";

type FieldErrors = Partial<Record<"photo" | "itemName" | "story", string>>;

export function CreateExhibitWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("input");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  // 보정 후보와 비교·재시도할 수 있도록, 방금 올린 원본은 확정 전까지 따로 기억해 둔다.
  const [originalPhotoPath, setOriginalPhotoPath] = useState<string | null>(null);
  const [originalPhotoPreviewUrl, setOriginalPhotoPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop] = useState<PhotoCrop>(DEFAULT_PHOTO_CROP);

  const [itemName, setItemName] = useState("");
  const [story, setStory] = useState("");
  const [period, setPeriod] = useState("");
  const [feature, setFeature] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mood, setMood] = useState<Mood>(DEFAULT_MOOD);
  const [showStory, setShowStory] = useState(true);

  const [titleCandidates, setTitleCandidates] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [lastGeneratedMood, setLastGeneratedMood] = useState<Mood>(DEFAULT_MOOD);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();

  function handleFileChange(file: File | null) {
    setPhotoFile(file);
    setPhotoPath(null);
    setOriginalPhotoPath(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    setPhotoPreviewUrl(previewUrl);
    setOriginalPhotoPreviewUrl(previewUrl);
    setCrop(DEFAULT_PHOTO_CROP);

    if (!file) return;
    setUploading(true);
    uploadExhibitPhoto(supabase, userId, file)
      .then((path) => {
        setPhotoPath(path);
        setOriginalPhotoPath(path);
      })
      .catch(() => toast.error("사진 업로드에 실패했습니다. 다시 시도해주세요."))
      .finally(() => setUploading(false));
  }

  function runGenerate(moodToUse: Mood) {
    startGenerateTransition(async () => {
      const result = await generateCopyAction({
        itemName,
        story,
        mood: moodToUse,
        period: period.trim() || undefined,
        feature: feature.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTitleCandidates(result.copy.titles);
      setTitle(result.copy.titles[0]);
      setDescription(result.copy.description);
      setHasGenerated(true);
      setLastGeneratedMood(moodToUse);
    });
  }

  function handleGoToCompose() {
    const nextErrors: FieldErrors = {};
    if (!photoFile) nextErrors.photo = "사진을 선택해주세요.";
    if (!itemName.trim()) nextErrors.itemName = "물건 이름을 입력해주세요.";
    if (!story.trim()) nextErrors.story = "사연을 입력해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPhase("compose");
    runGenerate(mood);
  }

  function handleConfirm() {
    if (!photoPath) {
      toast.error("사진 업로드가 끝날 때까지 기다려주세요.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("제목과 설명을 채워주세요.");
      return;
    }

    startSubmitTransition(async () => {
      const result = await createExhibitAction({
        photoPath,
        photoCrop: crop,
        itemName,
        story,
        mood: lastGeneratedMood,
        title,
        description,
        showStory,
        displayName: displayName.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/exhibits/${result.id}`);
    });
  }

  if (phase === "input") {
    return (
      <FieldGroup>
        <Field data-invalid={!!errors.photo}>
          <FieldLabel htmlFor="photo">물건 사진</FieldLabel>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            disabled={uploading}
            aria-invalid={!!errors.photo}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {errors.photo && <FieldError>{errors.photo}</FieldError>}
          {photoPreviewUrl && (
            <div className="mt-2 flex max-w-56 flex-col gap-2">
              <PhotoCropper imageSrc={photoPreviewUrl} crop={crop} onCropChange={setCrop} />
              {uploading && (
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Spinner className="size-3" /> 업로드 중...
                </p>
              )}
              {!uploading && (
                <PhotoRetouch
                  key={originalPhotoPath}
                  originalPhotoPath={originalPhotoPath}
                  originalPhotoUrl={originalPhotoPreviewUrl}
                  onSelect={(path, url) => {
                    setPhotoPath(path);
                    setPhotoPreviewUrl(url);
                  }}
                />
              )}
            </div>
          )}
        </Field>

        <Field data-invalid={!!errors.itemName}>
          <FieldLabel htmlFor="itemName">물건 이름</FieldLabel>
          <Input
            id="itemName"
            value={itemName}
            aria-invalid={!!errors.itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="예: 입사 기념 머그컵"
          />
          {errors.itemName && <FieldError>{errors.itemName}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.story}>
          <FieldLabel htmlFor="story">사연</FieldLabel>
          <Textarea
            id="story"
            value={story}
            aria-invalid={!!errors.story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="어떻게 갖게 됐나요? 왜 아직 가지고 있나요?"
            rows={5}
          />
          <FieldDescription>
            어떻게 갖게 됐나요? 왜 아직 가지고 있나요?
          </FieldDescription>
          {errors.story && <FieldError>{errors.story}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="period">사용 기간 (선택)</FieldLabel>
          <Input
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="예: 5년째"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="feature">특별한 특징 (선택)</FieldLabel>
          <Input
            id="feature"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            placeholder="예: 손잡이가 살짝 깨져 있다"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="displayName">전시에 표시할 이름/별명 (선택)</FieldLabel>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="비워두면 표시하지 않습니다"
          />
        </Field>

        <Button onClick={handleGoToCompose} size="lg">
          문구 만들기
        </Button>
      </FieldGroup>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => setPhase("input")}>
          ← 입력으로 돌아가기
        </Button>

        <Field>
          <FieldLabel>전시 문구 분위기</FieldLabel>
          <ToggleGroup
            value={[mood]}
            onValueChange={(value) => {
              if (value[0]) setMood(value[0] as Mood);
            }}
            variant="outline"
          >
            {MOODS.map((m) => (
              <ToggleGroupItem key={m} value={m}>
                {MOOD_LABEL[m]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Button
          variant="outline"
          className="w-fit"
          disabled={isGenerating}
          onClick={() => runGenerate(mood)}
        >
          {isGenerating ? <Spinner /> : <RefreshCwIcon data-icon="inline-start" />}
          {hasGenerated ? "다시 생성" : "생성"}
        </Button>

        {isGenerating && !hasGenerated ? (
          <Card>
            <CardContent className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Spinner /> AI가 전시 문구를 짓고 있습니다...
            </CardContent>
          </Card>
        ) : (
          hasGenerated && (
            <>
              <Field>
                <FieldLabel htmlFor="title">전시 제목</FieldLabel>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {titleCandidates.map((candidate) => (
                    <Button
                      key={candidate}
                      type="button"
                      size="sm"
                      variant={candidate === title ? "secondary" : "outline"}
                      onClick={() => setTitle(candidate)}
                    >
                      {candidate}
                    </Button>
                  ))}
                </div>
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

              <Button size="lg" disabled={isSubmitting} onClick={handleConfirm}>
                {isSubmitting && <Spinner />}
                전시 확정하기
              </Button>
            </>
          )
        )}
      </div>

      {hasGenerated && photoPreviewUrl && (
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
      )}
    </div>
  );
}
