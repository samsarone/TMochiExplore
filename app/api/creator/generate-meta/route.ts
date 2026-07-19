import {
  getAuthenticatedSamsarClient,
  samsarErrorResponse,
  unauthorizedResponse,
} from "../../../../lib/samsar-auth";

export const dynamic = "force-dynamic";

type GenerateMetaResponse = {
  title?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

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
      { error: "Metadata settings must be valid JSON." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const sessionId = stringValue(body.session_id ?? body.sessionId);
  const clientRequestId = stringValue(body.client_request_id ?? body.clientRequestId);
  if (!sessionId || sessionId.length > 200) {
    return Response.json(
      { error: "A valid completed video session ID is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!clientRequestId || clientRequestId.length > 200) {
    return Response.json(
      { error: "A valid metadata request ID is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await authenticated.client.postV2<GenerateMetaResponse>(
      "interactive_publication/generate_meta",
      {
        input: {
          session_id: sessionId,
          client_request_id: clientRequestId,
        },
      },
      { idempotencyKey: clientRequestId },
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
    return samsarErrorResponse(error, "Unable to generate publication metadata.");
  }
}
