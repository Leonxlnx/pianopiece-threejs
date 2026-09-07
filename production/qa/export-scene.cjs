// Preserve the established entrypoint while compiling every runtime dependency.
import('../../scripts/compile-performance.mjs').catch(error => {
  console.error(error); process.exitCode = 1;
});
