from pathlib import Path
r=Path(__file__).resolve().parent.parent;o=r/'integrated-review';src=(r/'lh-shared-b3/harness.mjs').read_text();src=src.replace("'./pianist-baseline.mjs'","'./pianist-candidate-baked.mjs'").replace("from './compiled/", "from '/workspace/sites/daybreak-piano-film/production/qa/compiled/")
src=src.replace(":'./compiled/wrist-motion.mjs'",":'/workspace/sites/daybreak-piano-film/production/qa/compiled/wrist-motion.mjs'")
src=src.replace("fs.readFileSync('baseline-score.json')","fs.readFileSync(process.env.DAYBREAK_SCORE??'score-v11.json')")
(o/'harness.mjs').write_text(src);(o/'metrics.mjs').write_text((r/'lh-shared-b3/metrics.mjs').read_text())
