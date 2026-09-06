# Daybreak

An original piano performance in a Three.js recital pavilion: a continuous skinned performer, 88 animated keys, pedal and damper motion, and a phrase-directed camera sequence synchronized to a sampled grand piano.

The current branch develops a new 3:47 pop composition, supported arms and hand motion, an ivory concert blouse and midnight trousers, and a warmer, furnished timber-and-limestone interior. **It remains a work in progress:** actual neighboring-finger intersections are being repaired. The existing public Site still contains the older performance.

Start with [the current revision report](production/pop-revision/README.md), then [handoff.md](handoff.md) for the recovered history. Reports under `production/revision/` describe earlier source states; they are not blanket approval of this branch.

## Run

Requires Node.js 22.13 or later. The bounded install/build helpers require Linux, GNU timeout, curl and flock.

```sh
npm run install:ci
npm run build
npm run start
```

For development, use `npm run dev`. In a managed Sites workspace, use the supported Sites preview workflow.

The exact validated character is stored losslessly in `production/assets/pianist.glb.br`. `predev` and `prebuild` restore `public/assets/pianist.glb` and check its SHA-256. Run `npm run assets:prepare` before standalone geometry tools after a fresh checkout. The browser still loads the ordinary GLB; it needs no additional decoder. The source archive reduces the new model from 17.12 MB to 11.12 MB without changing a vertex, texture, material or bind matrix.

## Project map

| Location | Purpose |
| --- | --- |
| `app/performance/` | Scene, pianist, keyboard, cameras, audio clock and transport |
| `public/assets/score.json` | Audible note events, fingering and baked wrist trajectories |
| `public/assets/daybreak.mp3` | Matching 44.1 kHz, 320 kbps sampled-piano master |
| `production/pop-revision/` | Current composition, garment sources, integration evidence and limitations |
| `production/qa/` | Actual geometry, motion, camera and rendering diagnostics |
| `production/revision/` | Preserved historical experiments and native export pipeline |
| `context/` | Earlier prompts, recovery inventory and technical handoff |

The adult avatar and source textures retain their documented CC0 attribution. Piano samples use the credited Salamander Grand Piano recordings under CC BY 3.0. See [asset credits](public/assets/credits.txt) and [music provenance](production/pop-revision/music/credits.txt).

