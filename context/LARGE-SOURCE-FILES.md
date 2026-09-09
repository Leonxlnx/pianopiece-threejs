# Historical evidence split for transfer

The GitHub connector has a 16 MiB request-body limit. Six original historical evidence objects exceeded the safe base64 upload size. Their exact bytes are stored in `context/large-source-files/` as smaller binary parts; `context/large-source-manifest.json` records original paths, modes, sizes, SHA-256 and Git blob hashes.

The application does not use these historical files at runtime. The normal app source and runtime assets remain at their original paths. Before rerunning historical scripts that require the larger evidence files, run from the repository root:

```sh
python3 context/restore-large-source-files.py
python3 context/restore-large-source-files.py --restore
```

The first command verifies every part and complete reconstructed object without writing. The second additionally creates missing original files. An existing different file is never overwritten. The source manifest binds these bytes to Sites source commit `3ad8c929eb60fabcb2e5fc4693ce4ae21508f98b`; later source updates are separate commits. This packaging preserves all bytes and does not turn failed historical experiments into accepted application changes.
