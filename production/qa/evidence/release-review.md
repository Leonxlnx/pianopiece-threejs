# Release regression results

Rechecked current source on 2026-09-05. No failed regression remains among the four reported findings.

- Actual keyboard handler probe: Ctrl+F invokes zero fullscreen calls; Space keydown plus autorepeat invokes one transport toggle. `release-controls.json`.
- Actual initialize/restored methods with delayed model load: restoration during initialization starts exactly one frame loop after load. `release-controls.json`.
- Actual disposeTree with real Three.js Mesh, Points, LineSegments, texture/material/geometry dispose events and a light-shadow disposal callback: all three geometries, three materials, three textures and one shadow dispose. `cleanup.json`.
- Source review confirms fatal loadError is independent of transient error. Its alert branch offers Reload only, Escape clears transient error only, and restart/seek/replay guard audioReady. The previously removable fatal recovery path is fixed.

No browser, deployed runtime, audio-output or listening claim is implied by these focused checks.
