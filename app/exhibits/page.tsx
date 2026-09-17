import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getSignedPhotoUrl, listMyExhibits } from "@/lib/exhibits/queries";
import { ExhibitCard } from "@/components/exhibits/exhibit-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PlusIcon } from "lucide-react";

export default async function MyExhibitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/exhibits");

  const exhibits = await listMyExhibits(user.id);
  const photoUrls = await Promise.all(
    exhibits.map((exhibit) => getSignedPhotoUrl(exhibit.photoPath)),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">내 전시관</h1>
        <Button render={<Link href="/exhibits/new" />} nativeButton={false}>
          <PlusIcon data-icon="inline-start" />
          새 전시 만들기
        </Button>
      </div>

      {exhibits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>아직 전시가 없습니다</EmptyTitle>
            <EmptyDescription>
              애착 있는 물건의 사진과 사연을 넣으면 AI가 전시 문구를 제안해드립니다.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/exhibits/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />
              첫 전시 만들기
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {exhibits.map((exhibit, i) => (
            <ExhibitCard
              key={exhibit.id}
              id={exhibit.id}
              title={exhibit.title}
              photoUrl={photoUrls[i]}
              photoCrop={exhibit.photoCrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
