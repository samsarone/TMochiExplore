import type {
  ExternalNarrativeVideoModel,
  TextToInteractiveVideoCreateResponse,
  TextToInteractiveVideoImageModel,
} from "samsar-js";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
} from "../../../../lib/creator-config";
import {
  getAuthenticatedSamsarClient,
  samsarErrorResponse,
  unauthorizedResponse,
} from "../../../../lib/samsar-auth";

export const dynamic = "force-dynamic";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const authenticated = await getAuthenticatedSamsarClient();
  if (!authenticated) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return Response.json(
      { error: "Generation settings must be valid JSON." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const prompt = stringValue(body.prompt);
  const duration = Number(body.duration);
  const numLevels = Number(body.num_levels ?? body.numLevels);
  const imageModel = stringValue(body.image_model ?? body.imageModel) as TextToInteractiveVideoImageModel;
  const videoModel = stringValue(body.video_model ?? body.videoModel) as ExternalNarrativeVideoModel;
  const clientRequestId = stringValue(body.client_request_id ?? body.clientRequestId);
  const draftSessionId = stringValue(body.draft_session_id ?? body.draftSessionId).slice(0, 200);

  if (!prompt || prompt.length > 4000) {
    return Response.json(
      { error: prompt ? "Story direction cannot exceed 4,000 characters." : "Describe the story you want to create." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!Number.isFinite(duration) || duration < 30 || duration > 180) {
    return Response.json(
      { error: "Duration must be between 30 and 180 seconds." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!Number.isInteger(numLevels) || numLevels < 1 || numLevels > 3) {
    return Response.json(
      { error: "tMochi supports one to three branching levels." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!IMAGE_MODELS.some((model) => model.value === imageModel)) {
    return Response.json(
      { error: "Choose a supported image model." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!VIDEO_MODELS.some((model) => model.value === videoModel)) {
    return Response.json(
      { error: "Choose a supported video model." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    if (draftSessionId) {
      const current = await authenticated.client.getV2StatusDetailed(draftSessionId);
      const currentStatus = String(current.data?.status || "").trim().toUpperCase();
      if (currentStatus !== "INIT" && currentStatus !== "DRAFT") {
        return Response.json(
          { error: "This session has already been submitted and cannot be submitted again." },
          { status: 409, headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    const generationInput = {
      prompt,
      duration,
      image_model: imageModel,
      video_model: videoModel,
      num_levels: numLevels,
    };
    const requestOptions = clientRequestId
      ? { idempotencyKey: clientRequestId.slice(0, 200) }
      : undefined;
    const result = draftSessionId
      ? await authenticated.client.postV2<TextToInteractiveVideoCreateResponse>(
          "text_to_interactive_video",
          {
            input: {
              ...generationInput,
              session_id: draftSessionId,
              narrative_type: "branched",
            },
          },
          requestOptions,
        )
      : await authenticated.client.createV2TextToInteractiveVideo(
          generationInput,
          requestOptions,
        );

    return Response.json(
      {
        ...result.data,
        ...(typeof result.creditsCharged === "number"
          ? { creditsCharged: result.creditsCharged }
          : {}),
        ...(typeof result.creditsRemaining === "number"
          ? { creditsRemaining: result.creditsRemaining }
          : {}),
      },
      { status: result.status, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return samsarErrorResponse(error, "Unable to start interactive video generation.");
  }
}
