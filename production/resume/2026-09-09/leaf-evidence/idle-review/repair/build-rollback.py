from pathlib import Path
import json,re
root=Path(__file__).resolve().parent;parent=root.parent
original=json.loads((parent/'sources/idle-nonthumb-data.json').read_text());fixed=json.loads(json.dumps(original));removed=fixed['supportedIndexGaps'].pop(58)
assert removed['previous']=='p00800' and removed['next']=='p00831'
delta={'status':'qualified index removal; curve-007 remains a blocker','operations':[{'op':'remove','collection':'supportedIndexGaps','match':removed,'expectedBefore':removed}],'remainingBlocker':{'collection':'curves','match':original['curves'][6],'reason':'No nonzero tested control/timing replacement eliminated new/worsened per-key >3 mm contacts. Removing the curve restores baseline geometry and forfeits its deep-contact reduction.'},'scope':'Apply only the listed record removal. Do not replace a newer complete score or idle-data file with this frozen snapshot.'}
(root/'delta.json').write_text(json.dumps(delta,indent=2)+'\n');(root/'data-fixed.json').write_text(json.dumps(fixed,indent=2)+'\n')
src=(parent/'candidate.mjs').read_text().replace("'./compiled/", "'../compiled/")
src=re.sub(r'^const idleNonthumbData = .+;$','const idleNonthumbData = '+json.dumps(fixed,separators=(',',':'))+';',src,flags=re.M)
(root/'fixed.mjs').write_text(src)
print('Wrote one bound record removal; curve remains unchanged')
