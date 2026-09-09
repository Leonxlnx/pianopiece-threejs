from pathlib import Path
import json,re
root=Path(__file__).resolve().parent;parent=root.parent
original=json.loads((parent/'sources/idle-nonthumb-data.json').read_text());fixed=json.loads(json.dumps(original));before=fixed['supportedIndexGaps'][58].copy()
assert before['previous']=='p00800' and before['next']=='p00831'
fixed['supportedIndexGaps'][58]['earlyRelease']=[176.02,176.065]
old='idleSmooth((c.nextTime - time) / .32)'
new=old+' * (c.earlyRelease ? 1 - idleSmooth((time - c.earlyRelease[0]) / (c.earlyRelease[1] - c.earlyRelease[0])) : 1)'
delta={'status':'index early-release correction; curve-007 remains a finite blocker','operations':[{'op':'add-fields','collection':'supportedIndexGaps','match':before,'expectedBefore':before,'fields':{'earlyRelease':[176.02,176.065]}}],'helperChange':{'before':old,'after':new,'typeAddition':'earlyRelease?: readonly [number, number]','defaultBehavior':'Multiplier is exactly 1 for every record without earlyRelease.'},'remainingBlocker':{'collection':'curves','match':original['curves'][6],'reason':'No nonzero tested control/timing replacement eliminated new/worsened per-key >3 mm contacts. Removing the curve restores baseline geometry and forfeits its deep-contact reduction.'},'scope':'Apply only the bound record field and the default-preserving helper expression. Do not replace newer complete scores or data with this frozen snapshot.'}
(root/'delta.json').write_text(json.dumps(delta,indent=2)+'\n');(root/'data-fixed.json').write_text(json.dumps(fixed,indent=2)+'\n')
src=(parent/'candidate.mjs').read_text().replace("'./compiled/", "'../compiled/").replace(old,new)
src=re.sub(r'^const idleNonthumbData = .+;$','const idleNonthumbData = '+json.dumps(fixed,separators=(',',':'))+';',src,flags=re.M)
(root/'fixed.mjs').write_text(src)
print('Bound cutoff:',before['previous'],before['next'],[176.02,176.065])
