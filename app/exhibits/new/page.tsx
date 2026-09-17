import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/exhibits/queries";
import { CreateExhibitWizard } from "@/components/exhibits/create-exhibit-wizard";

export default async function NewExhibitPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/exhibits/new");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <CreateExhibitWizard userId={user.id} />
    </div>
  );
}
