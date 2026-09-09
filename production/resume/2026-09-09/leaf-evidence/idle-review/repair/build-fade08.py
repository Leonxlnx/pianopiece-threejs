from pathlib import Path
import json,re
root=Path(__file__).resolve().parent;parent=root.parent
original=json.loads((parent/'sources/idle-nonthumb-data.json').read_text());fixed=json.loads(json.dumps(original));removed=fixed['supportedIndexGaps'][58].copy();fixed['supportedIndexGaps'][58]['arrivalFadeSeconds']=.8
assert removed['previous']=='p00800' and removed['next']=='p00831'
delta={'status':'index arrival-fade candidate; curve-007 remains a blocker','operations':[{'op':'add-fields','collection':'supportedIndexGaps','match':removed,'expectedBefore':removed,'fields':{'arrivalFadeSeconds':.8}}],'helperChange':{'before':'idleSmooth((c.nextTime - time) / .32)','after':'idleSmooth((c.nextTime - time) / (c.arrivalFadeSeconds ?? .32))','typeAddition':'arrivalFadeSeconds?: number','defaultSeconds':.32},'remainingBlocker':{'collection':'curves','match':original['curves'][6],'reason':'No nonzero tested control/timing replacement eliminated new/worsened per-key >3 mm contacts. Removing the curve restores baseline geometry and forfeits its deep-contact reduction.'},'scope':'Apply only the listed bound record field and the helper default-preserving expression. Do not replace a newer complete score or idle-data file with this frozen snapshot.'}
(root/'delta.json').write_text(json.dumps(delta,indent=2)+'\n');(root/'data-fixed.json').write_text(json.dumps(fixed,indent=2)+'\n')
src=(parent/'candidate.mjs').read_text().replace("'./compiled/", "'../compiled/").replace('idleSmooth((c.nextTime - time) / .32)','idleSmooth((c.nextTime - time) / (c.arrivalFadeSeconds ?? .32))')
src=re.sub(r'^const idleNonthumbData = .+;$','const idleNonthumbData = '+json.dumps(fixed,separators=(',',':'))+';',src,flags=re.M)
(root/'fixed.mjs').write_text(src)
print('Wrote one bound 0.8 s arrival fade and default-preserving helper expression; curve remains unchanged')
