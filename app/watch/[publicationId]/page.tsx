import type { Metadata } from "next";
import type { InteractivePublication } from "samsar-js";
import { cache } from "react";
import Home from "../../page";
import { samsarClient } from "../../../lib/samsar-client";

const getPublication = cache(async (publicationId: string) => {
  const result = await samsarClient.getInteractivePublication(publicationId);
  return result.data.publication;
});

const publicationOgImage = (publication: InteractivePublication) => {
  const defaultPath = publication.manifest.outputs.paths.find(
    (path) => path.path_id === publication.manifest.default_path_id,
  );

  // InteractivePublication thumbnails are materialized into public storage
  // when the publication is indexed. Reuse that durable first-frame asset;
  // never render a new social image while serving a shared watch page.
  return publication.mainThumbnailUrl || publication.thumbnailUrl || defaultPath?.thumbnailUrl;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}): Promise<Metadata> {
  const { publicationId } = await params;

  try {
    const publication = await getPublication(publicationId);
    const image = publicationOgImage(publication);
    const watchPath = `/watch/${encodeURIComponent(publication.id)}`;

    return {
      title: publication.title,
      description: publication.description,
      alternates: { canonical: watchPath },
      openGraph: {
        title: publication.title,
        description: publication.description,
        type: "website",
        url: watchPath,
        images: image ? [{ url: image, alt: publication.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: publication.title,
        description: publication.description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    // Preserve the site-wide metadata when the publication is unavailable.
    return {};
  }
}

export default async function WatchPublicationPage({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = await params;
  const publication = await getPublication(publicationId).catch(() => undefined);

  return (
    <Home
      initialPublicationId={publicationId}
      initialPublication={publication}
    />
  );
}
