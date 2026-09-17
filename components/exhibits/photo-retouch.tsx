"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { retouchExhibitPhotoAction } from "@/lib/exhibits/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SparklesIcon } from "lucide-react";

type Candidate = { photoPath: string; photoUrl: string; styleLabel: string };
type Selection = "original" | "retouched";

// retouch-exhibit-photo 스펙: 원본은 확정 전까지 계속 남아 있어 몇 번이든 비교·재시도할 수 있고,
// 확정 순간 그때 선택된 사진만 고정된다. 이 컴포넌트는 그 선택을 부모(photoPath 상태)에 위임한다.
// 새 사진을 올리면 이전 보정 후보는 더 이상 그 사진의 것이 아니므로, 부모가
// `key={originalPhotoPath}`로 이 컴포넌트를 리마운트해 내부 상태를 초기화한다.
export function PhotoRetouch({
  originalPhotoPath,
  originalPhotoUrl,
  onSelect,
}: {
  originalPhotoPath: string | null;
  originalPhotoUrl: string | null;
  onSelect: (photoPath: string, photoUrl: string) => void;
}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [selection, setSelection] = useState<Selection>("original");
  const [isRetouching, startRetouchTransition] = useTransition();

  function runRetouch() {
    if (!originalPhotoPath) return;
    startRetouchTransition(async () => {
      const result = await retouchExhibitPhotoAction(originalPhotoPath);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCandidate({
        photoPath: result.photoPath,
        photoUrl: result.photoUrl,
        styleLabel: result.styleLabel,
      });
      setSelection("retouched");
      onSelect(result.photoPath, result.photoUrl);
    });
  }

  if (!originalPhotoPath || !originalPhotoUrl) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={isRetouching}
        onClick={runRetouch}
      >
        {isRetouching ? <Spinner /> : <SparklesIcon data-icon="inline-start" />}
        {candidate ? "다른 스타일로 다시 보정" : "박물관처럼 보정하기"}
      </Button>

      {isRetouching && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Spinner className="size-3" /> AI가 박물관 분위기로 보정하고 있습니다...
        </p>
      )}

      {candidate && !isRetouching && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {candidate.styleLabel} 스타일로 보정됨
          </span>
          <Button
            type="button"
            size="sm"
            variant={selection === "retouched" ? "secondary" : "outline"}
            onClick={() => {
              setSelection("retouched");
              onSelect(candidate.photoPath, candidate.photoUrl);
            }}
          >
            보정본 쓰기
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selection === "original" ? "secondary" : "outline"}
            onClick={() => {
              setSelection("original");
              onSelect(originalPhotoPath, originalPhotoUrl);
            }}
          >
            원본 쓰기
          </Button>
        </div>
      )}
    </div>
  );
}
