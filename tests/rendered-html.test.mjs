import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost/"), { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the tMochi interactive cinema landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>tMochi — Interactive Cinema<\/title>/i);
  assert.match(html, /Don.t just watch/i);
  assert.match(html, /Don.t just watch\.\s*<em>Decide\.<\/em>/i);
  assert.match(html, /Interactive stories/i);
  assert.match(html, /lucide-wand-sparkles/i);
  assert.match(html, />Create<\/button>/i);
  assert.doesNotMatch(html, /<nav aria-label="Main navigation"/i);
  assert.match(html, /brand-t-fat/i);
  assert.doesNotMatch(html, /brand-t-notch/i);
  assert.match(html, /brand-word[^>]*>Mochi<\/span>/i);
  assert.doesNotMatch(html, /brand-o/i);
  assert.doesNotMatch(html, /brand-mark/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("server-renders shared player URLs in a paused loading state", async () => {
  const response = await render("/watch/shared-publication-id");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Loading interactive film/i);
  assert.doesNotMatch(html, /autoPlay/i);
});

test("server-renders a Samsar sign-in gate for the protected Creator Studio", async () => {
  const response = await render("/creator");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Creator Studio/i);
  assert.match(html, /Sign in to build/i);
  assert.match(html, /Continue with Samsar/i);
  assert.match(html, /Sign up/i);
  assert.match(html, /name="email"/i);
  assert.match(html, /name="password"/i);
});

test("keeps session-scoped Creator URLs behind the same sign-in gate", async () => {
  const response = await render("/creator/507f1f77bcf86cd799439011");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Creator Studio/i);
  assert.match(html, /Continue with Samsar/i);
});

test("keeps the viewer wired to the public interactive publication contract", async () => {
  const [page, route, detailRoute, watchPage, styles, layout, favicon, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interactive-publications/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interactive-publications/[publicationId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/watch/[publicationId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /InteractivePlayer/);
  assert.match(page, /branch_point_id/);
  assert.match(page, /leaf_path_ids/);
  assert.match(page, /switch_at_seconds/);
  assert.doesNotMatch(page, /Decision point|Left path|Right path/);
  assert.match(page, /handledChoices\.length === 0/);
  assert.match(page, /requestFullscreen/);
  assert.match(page, /controls-hidden/);
  assert.match(page, /bufferedPaths/);
  assert.match(page, /is-preloading/);
  assert.match(page, /primeBranchFrame/);
  assert.match(page, /playWithSound/);
  assert.match(page, /startPaused/);
  assert.match(page, /history\.pushState/);
  assert.match(page, /href=\{publicationPath\(publication\.id\)\}/);
  assert.doesNotMatch(page, /autoPlay=/);
  assert.doesNotMatch(page, /requestAnimationFrame/);
  assert.doesNotMatch(page, /rel="preload" as="video"/);
  assert.doesNotMatch(page, /Cinema with a pulse|Featured interactive/);
  assert.match(route, /listInteractivePublications/);
  assert.match(detailRoute, /getInteractivePublication/);
  assert.match(watchPage, /initialPublicationId/);
  assert.match(styles, /height:\s*100svh/);
  assert.match(styles, /player-start/);
  assert.match(layout, /favicon\.svg\?v=5/);
  assert.match(favicon, /<circle/);
  assert.match(favicon, /transform="translate\(10\.44 24\.9\) scale\(\.0269 -\.0269\)"/);
  assert.doesNotMatch(favicon, /<text/);
  assert.match(packageJson, /"samsar-js": "0\.48\.48"/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("wires Creator Studio to shared auth, unified generation, detailed polling, and publication", async () => {
  const [
    studio,
    creatorPage,
    creatorSessionPage,
    creatorLogin,
    loginRoute,
    registerRoute,
    sessionRoute,
    creatorSessionRoute,
    generateRoute,
    statusRoute,
    publishRoute,
    generateMetaRoute,
    artifactRoute,
    branchPreview,
    branchTree,
    completedPlayer,
    publishDialog,
    creatorStyles,
    samsarClient,
    samsarAuth,
    clientAuth,
    serverAuth,
    packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/creator/creator-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/[sessionId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/creator-login.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/login/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/register/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/creator/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/creator/generate/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/creator/status/[requestId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/creator/publish/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/creator/generate-meta/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/creator/artifact/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/branch-preview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/branch-tree.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/completed-player.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/publish-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/creator/creator.module.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/samsar-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/samsar-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/client-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/server-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(creatorPage, /verifySamsarUser/);
  assert.match(creatorSessionPage, /initialSessionId=\{normalizedSessionId\}/);
  assert.match(creatorSessionPage, /params:\s*Promise<\{ sessionId: string \}>/);
  assert.match(loginRoute, /users\/login/);
  assert.match(loginRoute, /\{ authToken, user:/);
  assert.doesNotMatch(loginRoute, /createSamsarClient|new SamsarClient/);
  assert.match(registerRoute, /users\/register/);
  assert.match(registerRoute, /preferredLanguage/);
  assert.doesNotMatch(registerRoute, /createSamsarClient|new SamsarClient/);
  assert.match(sessionRoute, /bearerToken \|\|/);
  assert.match(sessionRoute, /Authorization: `Bearer \$\{authToken\}`/);
  assert.match(serverAuth, /Domain=\.samsar\.one/);
  assert.match(serverAuth, /SameSite=Lax/);
  assert.match(clientAuth, /localStorage\.setItem\(AUTH_TOKEN_KEY, token\)/);
  assert.match(clientAuth, /Domain=\.samsar\.one/);
  assert.match(creatorLogin, /\/api\/auth\/register/);
  assert.match(creatorLogin, /persistAuthToken\(result\.authToken\)/);
  assert.match(creatorLogin, /Authorization: `Bearer \$\{token\}`/);
  assert.match(generateRoute, /createV2TextToInteractiveVideo/);
  assert.match(generateRoute, /text_to_interactive_video/);
  assert.match(generateRoute, /draft_session_id/);
  assert.match(generateRoute, /duration < 30 \|\| duration > 180/);
  assert.match(generateRoute, /numLevels < 1 \|\| numLevels > 3/);
  assert.match(creatorSessionRoute, /createBlankBranchedSession/);
  assert.match(statusRoute, /getV2StatusDetailed/);
  assert.match(publishRoute, /publishPublication/);
  assert.match(publishRoute, /profile\.username/);
  assert.match(generateMetaRoute, /interactive_publication\/generate_meta/);
  assert.match(generateMetaRoute, /clientRequestId\.length > 200/);
  assert.match(generateMetaRoute, /sessionId\.length > 200/);
  assert.match(generateMetaRoute, /idempotencyKey: clientRequestId/);
  assert.match(generateMetaRoute, /creditsCharged/);
  assert.match(generateMetaRoute, /creditsRemaining/);
  assert.match(artifactRoute, /verifyAuthenticatedSamsarProfile/);
  assert.match(artifactRoute, /redirect:\s*"manual"/);
  assert.doesNotMatch(artifactRoute, /endsWith\("\.cloudfront\.net"\)/);
  assert.match(studio, /CREATOR_REQUEST_STORAGE_KEY/);
  assert.match(studio, /POLL_INTERVAL_MS/);
  assert.match(studio, /pendingSubmissionRef/);
  assert.match(studio, /router\.replace\(`\/creator\/\$\{encodeURIComponent\(nextRequestId\)\}`/);
  assert.match(studio, /renderStarted && <section/);
  assert.match(studio, /min=\{30\}/);
  assert.match(studio, /max=\{180\}/);
  assert.match(studio, /ZipPassThrough/);
  assert.doesNotMatch(studio, /zipSync/);
  assert.match(studio, /Download artifacts/);
  assert.match(studio, /Purchase credits/);
  assert.match(studio, /Math\.min\(100, Math\.max\(0, resolveProgress\(status\)\)\)/);
  assert.match(studio, /onCreditsRemaining/);
  assert.doesNotMatch(studio, /Interactive cinema engine/);
  assert.doesNotMatch(studio, /Public feed/);
  assert.doesNotMatch(studio, /avatarUrl/);
  assert.match(studio, /Direct every <em>possible path\.<\/em>/);
  assert.match(branchPreview, /audio_timeline/);
  assert.match(branchPreview, /chooseRandomPath/);
  assert.match(branchTree, /leaf_path_ids/);
  assert.match(completedPlayer, /switch_at_seconds/);
  assert.match(completedPlayer, /playerChoiceOverlay/);
  assert.match(completedPlayer, /requestVideoFrameCallback/);
  assert.match(completedPlayer, /preload=\{isActive \? "auto" : "none"\}/);
  assert.match(publishDialog, /\/api\/creator\/generate-meta/);
  assert.match(publishDialog, /client_request_id: clientRequestId/);
  assert.match(publishDialog, /response\.status === 401/);
  assert.match(publishDialog, /response\.status === 402/);
  assert.match(publishDialog, /setTitle\(generatedTitle\.slice\(0, 160\)\)/);
  assert.match(publishDialog, /setDescription\(generatedDescription\.slice\(0, 2000\)\)/);
  assert.match(publishDialog, /onCreditsRemaining/);
  assert.match(creatorStyles, /\.progressTrack\s*\{[^}]*overflow:\s*hidden/);
  assert.match(creatorStyles, /\.progressTrack span\s*\{[^}]*max-width:\s*100%/);
  assert.match(samsarClient, /authToken/);
  assert.doesNotMatch(samsarClient, /apiKey[,\s:]/);
  assert.match(samsarAuth, /verifyWithConfiguredToken\(\)/);
  assert.doesNotMatch(samsarAuth, /verifyClientSession\(\{\s*authToken/);
  assert.match(packageJson, /"fflate"/);
});
