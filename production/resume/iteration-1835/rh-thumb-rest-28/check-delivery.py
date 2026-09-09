from pathlib import Path
import hashlib,json
p=Path(__file__).resolve().parent
for file,digest in json.loads((p/'provenance.json').read_text()).items():assert hashlib.sha256((p/file).read_bytes()).hexdigest()==digest,file
r=json.loads((p/'v4-surface-report.json').read_text());assert all(r[k]==0 for k in ['thumbPairs','thumbCore','opposing','newPairs','newKeys','heldParity','outsideParity'])
f=json.loads((p/'frozen-parity-report.json').read_text());assert all(f[k]==0 for k in ['probeToFrozenMismatches','otherBonesMismatches','heldOutsideMismatches']);assert not f['boundaryThumbPairs'] and not f['boundaryThumbCore']
m=json.loads((p/'motion-summary.json').read_text());assert m['candidate']['seek']==0 and m['candidate']['maxSkinSpeed']<m['baseline']['maxSkinSpeed']
idx=json.loads((p/'evidence/index.json').read_text());assert len(idx)==44
for row in idx:
 assert hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()==row['sha256']
 report=json.loads(Path(row['report']).read_text());assert len(report['frames'])==11 and all(f['glError']=='GL_NO_ERROR' for f in report['frames'])
print('PASS: source/data hashes, bounded surfaces, frozen parity, motion, and 44 strict frames')
