import type { AuthenticatedSamsarClient } from "./samsar-auth";
type BranchedDraftSessionResponse = {
  session_id?: string;
  request_id?: string;
  status?: string;
  narrative_type?: string;
  resumed?: boolean;
};

export async function createBlankBranchedSession(
  authenticated: AuthenticatedSamsarClient,
  { forceNew = false }: { forceNew?: boolean } = {},
) {
  const result = await authenticated.client.postV2<BranchedDraftSessionResponse>(
    "text_to_interactive_video/session",
    forceNew ? { input: { force_new: true } } : {},
  );
  const sessionId = result.data.session_id || result.data.request_id;
  if (!sessionId?.trim()) {
    throw new Error("Samsar did not return a Creator Studio session ID.");
  }
  const normalizedStatus = result.data.status?.trim().toUpperCase();
  return {
    sessionId: sessionId.trim(),
    status: normalizedStatus === "DRAFT" ? "INIT" : normalizedStatus || "INIT",
    resumed: result.data.resumed === true,
  };
}
