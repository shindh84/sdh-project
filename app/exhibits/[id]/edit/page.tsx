import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getExhibitById, getSignedPhotoUrl } from "@/lib/exhibits/queries";
import { EditExhibitForm } from "@/components/exhibits/edit-exhibit-form";

export default async function EditExhibitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/exhibits/${id}/edit`);

  const exhibit = await getExhibitById(id);
  if (!exhibit || exhibit.ownerId !== user.id) notFound();

  const photoUrl = await getSignedPhotoUrl(exhibit.photoPath);
  if (!photoUrl) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <EditExhibitForm
        userId={user.id}
        exhibitId={exhibit.id}
        initialTitle={exhibit.title}
        initialDescription={exhibit.description}
        initialShowStory={exhibit.showStory}
        initialDisplayName={exhibit.displayName ?? ""}
        initialPhotoPath={exhibit.photoPath}
        initialPhotoUrl={photoUrl}
        initialCrop={exhibit.photoCrop}
        story={exhibit.story}
      />
    </div>
  );
}
