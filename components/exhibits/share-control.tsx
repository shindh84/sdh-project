"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Share2Icon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
import { setVisibilityAction } from "@/lib/exhibits/actions";
import type { Visibility } from "@/lib/exhibits/types";

export function ShareControl({
  exhibitId,
  visibility,
}: {
  exhibitId: string;
  visibility: Visibility;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isShared = visibility === "link";
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/exhibits/${exhibitId}` : "";

  function handleToggle(next: boolean) {
    startTransition(async () => {
      const result = await setVisibilityAction(exhibitId, next ? "link" : "private");
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크를 복사했습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" size="sm" />}>
        <Share2Icon data-icon="inline-start" />
        공유
      </PopoverTrigger>
      <PopoverContent align="end" className="flex flex-col gap-4">
        <PopoverHeader>
          <PopoverTitle>링크로 공유</PopoverTitle>
          <PopoverDescription>
            켜면 링크를 아는 누구나 로그인 없이 이 전시를 볼 수 있습니다.
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">공유 켜기</span>
          <Switch checked={isShared} disabled={isPending} onCheckedChange={handleToggle} />
        </div>
        {isShared && (
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl} className="text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
              <CopyIcon />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
