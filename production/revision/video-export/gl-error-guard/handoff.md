# Strict OpenGL export checks

The production export path now aborts on the first reported OpenGL error after renderer initialization, cached environment restoration, every completed native sample readback, and a final temporal composite readback. The existing readback supplies synchronization; no explicit finish or flush was added. Each check reads the error once and immediately raises on any value other than GL_NO_ERROR.

A failed initialization releases its pose server and context and cannot certify a newly captured environment cache. A sample or composite failure stops the encoder, removes the current partial MP4, preserves its diagnostic trace/log, and never promotes the chunk or writes its success metadata. Previously completed chunk media and metadata remain byte-identical and resumable.

Validation exercised the actual renderer_module and render functions with injected GL/encoder fixtures: nine cases, 84 passed assertions, zero native frames. Cases cover initialization, cached upload, first/later native frames, HDR readback, second temporal sample, final composite, and clean single/temporal rendering. Existing native smoke chunks also remained verified and byte-identical. Scheduling, timestamp selection, encoder arguments, hashing, and assembly functions are unchanged. Python syntax passes.

Prepare a new job with this wrapper: existing jobs retain their original pinned exporter. The source renderer remains the verified fresh-framebuffer binding fix.

Wrapper SHA-256: `7dadf9a1668ed791f903aaaee9ec2e2d7433e55366fdbf271520e37444c29e4a`

Renderer SHA-256: `bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71`

Files: export_video.py and README.md in the parent directory; strict-gl-checks.patch, validate_gl_guard.py, validation.json here. No checkout edits, new audio copies, native rerenders, or full-film launch.
