import type { ReactNode } from "react";
import type { PhotoCrop } from "@/lib/exhibits/types";
import { Separator } from "@/components/ui/separator";

export type ExhibitViewProps = {
  title: string;
  description: string;
  photoUrl: string;
  photoCrop: PhotoCrop;
  story: string;
  showStory: boolean;
  displayName?: string | null;
  /** 작성자 전용 조작 UI. 감상 콘텐츠보다 약하게 보이도록 이 컴포넌트가 직접 배치한다. */
  ownerActions?: ReactNode;
};

// 미리보기, 확정 직후 화면, 작성자 화면, (task 02의) 관람자 화면이 모두 이 컴포넌트 하나를 쓴다.
export function ExhibitView({
  title,
  description,
  photoUrl,
  photoCrop,
  story,
  showStory,
  displayName,
  ownerActions,
}: ExhibitViewProps) {
  return (
    <article className="flex flex-col">
      <div className="bg-muted relative aspect-square w-full overflow-hidden sm:aspect-4/3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={title}
          className="h-full w-full object-cover"
          style={{ objectPosition: `${photoCrop.x}% ${photoCrop.y}%` }}
        />
        {ownerActions && (
          <div className="absolute top-3 right-3 flex gap-2 [&_svg]:size-4">{ownerActions}</div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          {displayName && (
            <p className="text-muted-foreground text-sm">{displayName}</p>
          )}
        </div>

        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{description}</p>

        {showStory && story && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-sm font-medium">원래 사연</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{story}</p>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
