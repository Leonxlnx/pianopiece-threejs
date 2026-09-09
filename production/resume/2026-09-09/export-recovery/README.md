# Export recovery after workspace cleanup

On 9 September around09:35 UTC the active conversation scratch directory was removed during the native export. Last measured progress was4800/6995 frames; the full film was not delivered. The renderer and completion watcher lost their working files.

The saved25 and50 percent archives restored3540 frames in59 native chunks. Every restored video SHA-256 matches its existing metadata and every source fingerprint is the frozen eac8bd113e050acf job. The exact saved WAV also still matches c583f9e1. The old interrupted processes are not evidence of further progress.

The full repository was recovered from GitHub main57926b31649846db9b2a7be8ca24a0bff84f1394 after the Sites source endpoint returned HTTP500 for clone attempts. The authoritative recovery checkout is /workspace/daybreak-github-recovered. No product source or public deployment changed.

Derived render data now resides at /workspace/daybreak-film-continued, with the original job path maintained as a local alias. Source dependency paths likewise resolve to the verified checkout. recover-film-snapshot.py reconstructs the pinned snapshot from existing saved hashes and rejects any changed input, dependency, compiled module or wrapper. It does not alter the binding hashes to make a resume pass.

Resume only missing chunks after snapshot reconstruction passes. Preserve the original master, timing, dimensions, samples and all final assembly guards. Read the live job reports for progress; historical percentages and expired tool handles are not current status.
