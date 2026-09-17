"use client";

import { useRef, useState } from "react";
import type { PhotoCrop } from "@/lib/exhibits/types";
import { cn } from "@/lib/utils";

type PhotoCropperProps = {
  imageSrc: string;
  crop: PhotoCrop;
  onCropChange: (crop: PhotoCrop) => void;
  className?: string;
};

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

// 정사각형 틀 안에서 object-position만 옮기는 단순한 위치 조정 도구.
// 사용자가 아무것도 하지 않으면 기본값(50,50 = 정중앙)이 그대로 쓰인다.
export function PhotoCropper({ imageSrc, crop, onCropChange, className }: PhotoCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function updateFromPointer(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * 100);
    const y = clamp(((clientY - rect.top) / rect.height) * 100);
    onCropChange({ x, y });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        ref={containerRef}
        role="slider"
        aria-label="사진 위치 조정"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(crop.x)}
        tabIndex={0}
        className="bg-muted relative aspect-square w-full cursor-move overflow-hidden rounded-md select-none"
        onPointerDown={(e) => {
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging) updateFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
        onKeyDown={(e) => {
          const step = 5;
          if (e.key === "ArrowLeft") onCropChange({ ...crop, x: clamp(crop.x - step) });
          if (e.key === "ArrowRight") onCropChange({ ...crop, x: clamp(crop.x + step) });
          if (e.key === "ArrowUp") onCropChange({ ...crop, y: clamp(crop.y - step) });
          if (e.key === "ArrowDown") onCropChange({ ...crop, y: clamp(crop.y + step) });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${crop.x}% ${crop.y}%` }}
        />
        <div
          className="border-background pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-black/50 shadow"
          style={{ left: `${crop.x}%`, top: `${crop.y}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        사진을 드래그하거나 방향키로 눌러서 전시 틀에 보일 위치를 맞출 수 있습니다.
      </p>
    </div>
  );
}
