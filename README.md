# TMochiLearn 🎬

[![Tests](https://github.com/samsarone/TmochiLearn/actions/workflows/ci.yml/badge.svg)](https://github.com/samsarone/TmochiLearn/actions/workflows/ci.yml)

**The world’s first and only interactive cinema creator.**

Initial implementation in response to Fal x Sequoia hackathon.

TMochiLearn turns a single idea into a living film with choices, alternate scenes,
and endings shaped by the audience. Describe the story you want to tell, direct
how far it can branch, and watch an entire cinematic story tree come alive.

This is not a video with buttons added afterward. Every path is part of one
connected movie, built to let viewers step inside the story and decide what
happens next.

## Don’t just watch. Decide.

A TMochiLearn film moves like modern streaming cinema—until the story reaches a
moment that belongs to the viewer.

- A subtle **Choose the next path** cue appears before each decision.
- Cinematic branch thumbnails fade naturally into the scene.
- Every choice continues from the same moment without losing sound or playback
  settings.
- Multi-level stories remember the path already taken.
- Shared film links open directly in the interactive player.
- The public cinema feed makes published stories easy to discover and replay.

## One premise. Every possible path.

The Creator Studio is designed for storytellers, not editing timelines.

1. **Describe your movie** — start with a premise, character, conflict, or
   impossible choice.
2. **Choose the depth** — create a focused fork or a story tree with up to three
   levels of decisions.
3. **Watch the world form** — follow live generation progress and see the branch
   map fill with scenes.
4. **Preview every route** — explore random paths or direct the story choice by
   choice.
5. **Name the transmission** — write the public details yourself or let TMochiLearn
   generate a title and description.
6. **Publish the experience** — release it to the TMochiLearn cinema feed or download
   the complete artifact package.

## Made for interactive storytellers

- **Prompt-to-interactive-film creation** powered by Samsar
- **One-to-three-level story trees** with distinct branches and endings
- **Live branch topology** that shows the structure as it is created
- **Resumable sessions** so a film remains available at its own Creator URL
- **Interactive previews** with media-accurate decision points
- **Smart publishing metadata** generated from the completed movie
- **Transparent credit estimates and balances** throughout creation
- **Downloadable production artifacts** for every rendered path
- **A cinematic public library** with search, featured stories, and shareable
  watch links

## A cinema with more than one ending

TMochiLearn is built around a simple belief: audiences can be more than spectators.
They can protect a character, follow the signal, open the forbidden door, or
walk away—and the film should be ready for every decision.

The result is a new format between cinema and storytelling: authored enough to
feel intentional, alive enough to surprise even its creator.

## Powered by Samsar

TMochiLearn uses Samsar to create, render, resume, and publish branching films.
Existing Samsar accounts work in the Creator Studio, and completed interactive
publications flow into the same public catalog used by the viewer.

## For contributors

The project requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Run the same checks shown by the badge:

```bash
npm run lint
npm test
```

`npm test` builds the Cloudflare Worker version and runs the existing Node.js
integration suite against the rendered cinema, shared player routes, Creator
authentication, branching contracts, generation flow, and publishing tools.

<details>
<summary>Configuration and deployment notes</summary>

The Samsar API defaults to `https://api.samsar.one/v1`. Set
`SAMSAR_API_BASE_URL` to use another API origin. Creator requests use the
signed-in user’s shared Samsar bearer session. Creator image and video options
are loaded server-side from the public `/video/supported_models` Express model
catalog and submissions are revalidated against that catalog. Additional
artifact hosts can be provided with the comma-separated `SAMSAR_ARTIFACT_HOSTS`
value.

To preview the local UI against the live production publication catalog, run:

```bash
npm run dev:production-catalog
```

This only reads the public production catalog for the viewer. Creator actions
still require a signed-in Samsar session.

For Vercel, use the Next.js framework preset and the standard `npm run build`
output. The optional Cloudflare Worker workflow is available through
`npm run dev:worker`, `npm run build:worker`, and `npm run start:worker`.

</details>

---

**Make a movie. Build every choice. Let the audience decide.**
