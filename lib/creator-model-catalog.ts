import {
  createCreatorModelCatalog,
  type CreatorModelCatalog,
} from "./creator-config";
import { SAMSAR_API_BASE_URL } from "./samsar-client";

export const CREATOR_MODEL_CATALOG_ERROR =
  "Express model options are temporarily unavailable. Refresh the page to try again.";

export async function getCreatorModelCatalog(): Promise<CreatorModelCatalog> {
  const endpoint = `${SAMSAR_API_BASE_URL.replace(/\/+$/, "")}/video/supported_models`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Samsar Express model catalog returned HTTP ${response.status}.`);
  }

  const payload = await response.json().catch(() => null);
  const catalog = createCreatorModelCatalog(payload);
  if (!catalog.imageModels.length || !catalog.videoModels.length) {
    throw new Error("Samsar Express model catalog did not include image and video options.");
  }

  return catalog;
}

export async function loadCreatorModelCatalog(): Promise<{
  catalog: CreatorModelCatalog;
  error: string | null;
}> {
  try {
    return { catalog: await getCreatorModelCatalog(), error: null };
  } catch (error) {
    console.error("[tmochi_creator] unable to load Express model catalog", error);
    return {
      catalog: { imageModels: [], videoModels: [] },
      error: CREATOR_MODEL_CATALOG_ERROR,
    };
  }
}
