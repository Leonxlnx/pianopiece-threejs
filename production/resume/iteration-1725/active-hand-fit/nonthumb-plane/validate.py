from pathlib import Path
import json,hashlib
root=Path('nonthumb-plane');read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r=read(root/'comparison.json');assert r['scoreSha256']==sha(Path('r79-frozen-v2.json'));assert r['thumbAndWristQuaternionsExact']and r['nonfiniteFrames']==0
assert r['baseline']['handFrames']==r['candidate']['handFrames']==2140
assert r['candidate']['frameCounts']['activeNonthumbCore']>r['baseline']['frameCounts']['activeNonthumbCore']
assert len(read(root/'active-affected-queue.json'))==r['activeAffectedNotes']==80
assert len(read(root/'idle-affected-queue.json'))==r['idleAffectedGaps']==167
assert read(root/'degeneracy-check.json')['passed']
images=0
for label in ['baseline','candidate']:
 rig=Path('../hand-runtime/pianist-arms-compact5.ts')if label=='baseline'else root/'pianist-palm-plane.ts'
 for f in read(root/'renders'/label/'image-index.json'):
  assert sha(Path(f['image']))==f['imageSha256'];assert f['glError']=='GL_NO_ERROR';assert f['sourceSha256']['public/assets/score.json']==r['scoreSha256'];assert f['sourceSha256']['app/performance/pianist.ts']==sha(rig);assert f['sourceSha256']['app/performance/wrist-motion.ts']==sha(Path('wrist-motion-arc.ts'));images+=1
assert images==16
out={'passed':True,'decision':'Rejected as a global drop-in on frozen score','handFramesPerRuntime':2140,'renderedAndReviewedFrames':images,'activeAffectedContexts':80,'idleAffectedGaps':167};(root/'gate-check.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
