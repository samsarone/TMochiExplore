export const CREATOR_COOKIE_NAME = "authToken";
export const CREATOR_REQUEST_STORAGE_KEY = "tmochi.creator.state.v2";
export const SAMSAR_BILLING_URL = "https://app.samsar.one/account/billing";

export type ExpressModelCatalogItem = {
  value: string;
  label?: string;
  basePrice?: number;
  pricingDistribution?: {
    total?: number;
  };
};

export type CreatorImageModelOption = {
  value: string;
  label: string;
  detail: string;
};

export type CreatorVideoModelOption = {
  value: string;
  label: string;
  detail: string;
  creditsPerSecond: number;
};

export type CreatorModelCatalog = {
  imageModels: CreatorImageModelOption[];
  videoModels: CreatorVideoModelOption[];
};

// These maps only preserve TMochiLearn's existing presentation. Model
// availability and request validation always come from Samsar's public Express
// model catalog.
const IMAGE_MODEL_PRESENTATION: Record<string, { label: string; detail: string; order: number }> = {
  GPTIMAGE2: { label: "GPT Image 2", detail: "Strong prompt fidelity", order: 1 },
  NANOBANANAPRO: { label: "Nano Banana Pro", detail: "High-detail compositions", order: 2 },
  SEEDREAM: { label: "Seedream", detail: "Stylized lesson visuals", order: 3 },
  "WAN2.7PRO": { label: "Wan 2.7 Pro", detail: "Expressive demonstrations", order: 4 },
};

const VIDEO_MODEL_PRESENTATION: Record<string, { label: string; detail: string; order: number }> = {
  COSMOS3SUPERI2V: { label: "Nvidia Cosmos 3", detail: "Efficient · clear motion", order: 1 },
  RUNWAYML: { label: "Runway Gen-4.5", detail: "Versatile · default", order: 2 },
  SEEDANCEI2V: { label: "Seedance 1.5", detail: "Fluid motion", order: 3 },
  "VEO3.1I2VFAST": { label: "Veo 3.1 Fast", detail: "Fast · high fidelity", order: 4 },
  KLINGIMGTOVID3PRO: { label: "Kling 3 Pro", detail: "Detailed motion", order: 5 },
  KLINGIMGTOVIDTURBO: { label: "Kling Turbo", detail: "Fast detailed motion", order: 6 },
  HAPPYHORSEI2V: { label: "Happy Horse 1.1", detail: "Expressive movement", order: 7 },
  "VEO3.1I2V": { label: "Veo 3.1", detail: "Premium fidelity", order: 8 },
};

function normalizedCatalogItems(value: unknown): ExpressModelCatalogItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: ExpressModelCatalogItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const modelValue = typeof record.value === "string" ? record.value.trim() : "";
    if (!modelValue || seen.has(modelValue)) continue;
    seen.add(modelValue);
    const pricingDistribution = record.pricingDistribution && typeof record.pricingDistribution === "object"
      ? record.pricingDistribution as { total?: number }
      : undefined;
    items.push({
      value: modelValue,
      label: typeof record.label === "string" ? record.label.trim() : undefined,
      basePrice: Number.isFinite(Number(record.basePrice)) ? Number(record.basePrice) : undefined,
      pricingDistribution,
    });
  }

  return items;
}

export function createCreatorModelCatalog(payload: unknown): CreatorModelCatalog {
  const response = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : {};
  const imageItems = normalizedCatalogItems(response.IMAGE_MODELS);
  const videoItems = normalizedCatalogItems(response.VIDEO_MODELS);

  const imageModels = imageItems
    .map((model, index) => {
      const presentation = IMAGE_MODEL_PRESENTATION[model.value];
      return {
        value: model.value,
        label: presentation?.label || model.label || model.value,
        detail: presentation?.detail || "Express image generation",
        order: presentation?.order ?? 1_000 + index,
      };
    })
    .sort((left, right) => left.order - right.order)
    .map((model) => ({
      value: model.value,
      label: model.label,
      detail: model.detail,
    }));

  const videoModels = videoItems
    .map((model, index) => {
      const presentation = VIDEO_MODEL_PRESENTATION[model.value];
      const distributionTotal = Number(model.pricingDistribution?.total);
      const basePrice = Number(model.basePrice);
      return {
        value: model.value,
        label: presentation?.label || model.label || model.value,
        detail: presentation?.detail || "Express video generation",
        creditsPerSecond: Number.isFinite(distributionTotal)
          ? distributionTotal
          : Number.isFinite(basePrice)
            ? basePrice
            : 30,
        order: presentation?.order ?? 1_000 + index,
      };
    })
    .sort((left, right) => left.order - right.order)
    .map((model) => ({
      value: model.value,
      label: model.label,
      detail: model.detail,
      creditsPerSecond: model.creditsPerSecond,
    }));

  return { imageModels, videoModels };
}

export function estimateInteractiveCredits(
  duration: number,
  levels: number,
  videoModel: string,
  videoModels: ReadonlyArray<CreatorVideoModelOption>,
) {
  const creditsPerSecond =
    videoModels.find((model) => model.value === videoModel)?.creditsPerSecond ?? 30;
  const normalizedDuration = Math.min(240, Math.max(10, Number(duration) || 10));
  const normalizedLevels = Math.min(3, Math.max(1, Math.round(Number(levels) || 1)));

  // Before the narrative exists, divergence points are unknown. This is the
  // conservative ceiling where every final path spans the requested duration.
  return Math.ceil(
    creditsPerSecond * normalizedDuration * Math.pow(2, normalizedLevels),
  );
}
