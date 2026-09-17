import Link from "next/link";
import type { PhotoCrop } from "@/lib/exhibits/types";

export function ExhibitCard({
  id,
  title,
  photoUrl,
  photoCrop,
}: {
  id: string;
  title: string;
  photoUrl: string | null;
  photoCrop: PhotoCrop;
}) {
  return (
    <Link
      href={`/exhibits/${id}`}
      className="group focus-visible:ring-ring flex flex-col gap-2 rounded-lg outline-none focus-visible:ring-2"
    >
      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            style={{ objectPosition: `${photoCrop.x}% ${photoCrop.y}%` }}
          />
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium">{title}</p>
    </Link>
  );
}
