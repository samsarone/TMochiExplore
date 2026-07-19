import { createBlankBranchedSession } from "../../../../lib/creator-session";
import {
  getAuthenticatedSamsarClient,
  unauthorizedResponse,
} from "../../../../lib/samsar-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authenticated = await getAuthenticatedSamsarClient();
  if (!authenticated) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({})) as { forceNew?: unknown };
    const session = await createBlankBranchedSession(authenticated, {
      forceNew: body.forceNew === true,
    });
    return Response.json(
      { ...session, sessionType: "branched" },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to create a Creator Studio session.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
