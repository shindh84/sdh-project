import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6">
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          평범한 물건 박물관
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed text-balance">
          애착 있는 물건의 사진과 짧은 사연을 건네면, AI가 전시 제목과 설명을 제안합니다. 문구를
          고쳐 확정하면 내 전시관에 남고, 원하면 링크로 친구에게 보여줄 수 있습니다.
        </p>
      </div>
      <Button size="lg" render={<Link href="/exhibits/new" />} nativeButton={false}>
        내 물건 전시하기
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
