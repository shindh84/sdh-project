import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, getExhibitById, getSignedPhotoUrl } from "@/lib/exhibits/queries";
import { ExhibitView } from "@/components/exhibits/exhibit-view";
import { Button } from "@/components/ui/button";
import { DeleteExhibitButton } from "@/components/exhibits/delete-exhibit-button";
import { ShareControl } from "@/components/exhibits/share-control";
import { PencilIcon } from "lucide-react";

export default async function ExhibitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exhibit = await getExhibitById(id);
  if (!exhibit) notFound();

  const [user, photoUrl] = await Promise.all([
    getCurrentUser(),
    getSignedPhotoUrl(exhibit.photoPath),
  ]);
  const isOwner = user?.id === exhibit.ownerId;

  if (!photoUrl) notFound();

  return (
    <ExhibitView
      title={exhibit.title}
      description={exhibit.description}
      photoUrl={photoUrl}
      photoCrop={exhibit.photoCrop}
      story={exhibit.story}
      showStory={exhibit.showStory}
      displayName={exhibit.displayName}
      ownerActions={
        isOwner ? (
          <>
            <ShareControl exhibitId={exhibit.id} visibility={exhibit.visibility} />
            <Button
              variant="secondary"
              size="sm"
              render={<Link href={`/exhibits/${exhibit.id}/edit`} />}
              nativeButton={false}
            >
              <PencilIcon data-icon="inline-start" />
              수정
            </Button>
            <DeleteExhibitButton id={exhibit.id} />
          </>
        ) : undefined
      }
    />
  );
}
