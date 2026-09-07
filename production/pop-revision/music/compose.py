#!/usr/bin/env python3
"""Daybreak: an original, hand-authored 88-bar piano-pop song.

The literal melody/harmony tables are the composition. The performance pass
adds deterministic touch and feasible fingering; it does not generate tunes.
Run in this folder to recreate score.json. The site uses the performed seconds.
"""
from pathlib import Path
import collections, hashlib, itertools, json, math

HERE=Path(__file__).resolve().parent
PC={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def midi(s):
    return (int(s[-1])+1)*12+PC[s[0]]+({'#':1,'b':-1}.get(s[1:-1],0))
def phrase(spec):
    # Comma-separated pitch:duration tokens, '_' is a measured rest.
    out=[]; beat=0.
    for tok in spec.split():
        pitch,dur=tok.split(':');dur=float(dur)
        if pitch!='_':out.append((beat,midi(pitch),dur))
        beat+=dur
    assert abs(beat-4)<1e-8,(spec,beat)
    return out

INTRO=[
    '_:1 E4:.75 G4:.75 E4:1.5',
    'D4:1 E4:.5 D4:.5 C4:1 _:1',
    '_:.5 A4:1 C5:.5 A4:1 G4:1',
    'D5:1 C5:.5 B4:.5 G4:1 _:1',
]
VERSE=[
    'E4:.75 G4:.75 G4:.5 A4:1 G4:.5 _:0.5',
    'D4:1 G4:.5 A4:.5 B4:1 _:1',
    'E4:.75 A4:.75 A4:.5 G4:1 E4:1',
    'F4:1 A4:.5 G4:.5 E4:1 _:1',
    'G4:.5 E4:.5 G4:1 C5:1 B4:.5 _:0.5',
    'A4:1 G4:.5 A4:.5 C5:1 _:1',
    'A4:.75 C5:.75 A4:.5 F4:1 E4:.5 F4:.5',
    'G4:1 A4:.5 B4:.5 D5:1 _:1',
    'E4:.75 G4:.75 G4:.5 C5:1 B4:1',
    'A4:.5 G4:.5 D4:1 G4:1 _:1',
    'E4:.75 A4:.75 C5:.5 B4:1 A4:1',
    'A4:1 G4:.5 F4:.5 E4:1 _:1',
    'F4:.5 A4:.5 C5:1 A4:.5 G4:.5 F4:1',
    'E4:1 A4:.5 B4:.5 C5:1 _:1',
    'A4:.75 C5:.75 D5:.5 C5:1 A4:1',
    'G4:1 B4:.5 C5:.5 D5:1 _:1',
]
PRE=[
    'C5:1 B4:.5 A4:.5 C5:1 E5:1',
    'D5:1 B4:.5 A4:.5 G4:1 B4:1',
    'C5:.75 C5:.75 D5:.5 E5:1 D5:1',
    'E5:1 D5:.5 C5:.5 G4:1 _:1',
    'A4:.75 C5:.75 D5:.5 F5:1 E5:1',
    'E5:1 D5:.5 C5:.5 D5:1 E5:1',
    'D5:.75 D5:.75 E5:.5 G5:1 F5:1',
    'D5:1 B4:1 _:1 G4:.5 D5:.5',
]
CHORUS=[
    'E5:.75 G5:.75 G5:.5 E5:1 D5:1',
    'D5:.75 E5:.25 D5:1 B4:.5 _:0.5 G4:1',
    'C5:.75 E5:.75 E5:.5 D5:1 C5:1',
    'A4:.75 C5:.25 D5:1 C5:1 A4:.5 _:0.5',
    'E5:.75 G5:.75 G5:.5 E5:1 C5:1',
    'D5:.75 E5:.25 D5:1 B4:1 D5:1',
    'E5:.75 E5:.75 G5:.5 A5:1 G5:1',
    'F5:1 E5:.5 D5:.5 C5:1 _:1',
    'A4:.75 C5:.75 D5:.5 F5:1 E5:1',
    'E5:1 D5:.5 C5:.5 G4:1 C5:1',
    'A4:.75 C5:.75 E5:.5 D5:1 C5:1',
    'B4:1 A4:.5 G4:.5 D5:1 _:1',
]
VERSE2=[
    'E4:1 A4:.5 C5:.5 B4:1 A4:1',
    'G4:.75 B4:.75 B4:.5 A4:1 G4:.5 _:0.5',
    'A4:1 C5:.5 A4:.5 G4:1 F4:1',
    'E4:.75 G4:.75 C5:.5 B4:1 _:1',
    'A4:.75 C5:.75 D5:.5 C5:1 A4:1',
    'G4:.5 E4:.5 A4:1 C5:1 _:1',
    'C5:1 A4:.5 G4:.5 A4:1 C5:1',
    'B4:1 A4:.5 G4:.5 D5:1 _:1',
]
BRIDGE=[
    'E5:1.5 C5:.5 A4:1 _:1',
    'C5:1 B4:.5 A4:.5 E4:1 _:1',
    'A4:1.5 G4:.5 E4:1 _:1',
    'G4:1 E4:.5 D4:.5 C4:1 _:1',
    'F4:1 A4:.5 C5:.5 D5:1 C5:1',
    'C5:1 Ab4:1 G4:1 F4:1',
    'G4:.75 C5:.75 D5:.5 E5:1 D5:1',
    'B4:1 D5:1 _:1 G5:1',
]
FINAL=CHORUS[:4]+[
    'G5:.75 C6:.75 C6:.5 B5:1 G5:1',
    'G5:.75 A5:.25 G5:1 D5:1 B4:1',
    'E5:.75 G5:.75 A5:.5 A5:1 G5:1',
    'F5:1 E5:.5 D5:.5 C5:1 _:1',
    'F5:.75 A5:.75 A5:.5 G5:1 F5:1',
    'E5:1 G5:.5 E5:.5 D5:1 C5:1',
    'A4:.75 C5:.75 E5:.5 D5:1 C5:1',
    'B4:1 A4:.5 G4:.5 D5:1 _:1',
]
CODA=[
    'E5:.75 G5:.75 G5:.5 E5:1 C5:1',
    'A4:1 C5:.5 A4:.5 G4:1 E4:1',
    'F4:1 Ab4:.5 G4:.5 F4:1 D4:1',
    'C4:4',
]

# Bass followed by a close upper grip (all notes belong to the named harmony).
# Thumb is a white upper note; small grip travel is planned before each attack.
H={
 'C':('C3',['E3','G3']), 'G/B':('B2',['D3','G3']),
 'Am7':('A2',['E3','G3']), 'Fadd9':('F2',['A2','C3']),
 'C/E':('E2',['G2','C3']), 'Dm7':('D3',['F3','A3']),
 'G':('G2',['B2','D3']), 'Gsus':('G2',['C3','D3']),
 'Am/E':('E2',['A2','C3']), 'Em/G':('G2',['B2','E3']),
 'Am':('A2',['C3','E3']), 'Am/G':('G2',['C3','E3']),
 'Fmaj7':('F2',['A2','E3']), 'Fm6':('F2',['Ab2','D3']),
 'C6':('C3',['E3','A3']),
}
FORM=[
 ('First light','intro',.30,INTRO,['C','Am7','Fadd9','G']),
 ('A window opens','verse',.50,VERSE,['C','G/B','Am7','Fadd9','C/E','Fadd9','Dm7','Gsus','C','G/B','Am7','Fadd9','Dm7','Am/E','Fadd9','G']),
 ('Closer to the morning','pre',.69,PRE,['Am7','G','Fadd9','C/E','Dm7','Fadd9','Gsus','G']),
 ('Daybreak','chorus',.83,CHORUS,['C','G','Am7','Fadd9','C/E','G','Am7','Fadd9','Dm7','C/E','Fadd9','G']),
 ('The room breathes','post',.46,INTRO,['C','G/B','Am7','Fadd9']),
 ('A light left on','verse2',.55,VERSE2,['Am7','Em/G','Fadd9','C/E','Dm7','Am/E','Fadd9','G']),
 ('A little nearer','pre2',.74,PRE[4:],['Dm7','Fadd9','Gsus','G']),
 ('Daybreak returns','chorus2',.86,CHORUS[:8],['C','G','Am7','Fadd9','C/E','G','Am7','Fadd9']),
 ('Before the sun','bridge',.41,BRIDGE,['Am','Am/G','Fmaj7','C/E','Dm7','Fm6','Gsus','G']),
 ('Everything opens','final',1.,FINAL,['C','G','Am7','Fadd9','C/E','G','Am7','Fadd9','Dm7','C/E','Fadd9','G']),
 ('Home in the light','coda',.35,CODA,['C','Fmaj7','Fm6','C']),
]

notes=[];sections=[];harmony=[];pedals=[{'time':0,'value':0}];accents=[];tempo=[]
now=0.;bar=0
for name,kind,energy,melodies,chords in FORM:
    section_start=now
    for local,(spec,chord) in enumerate(zip(melodies,chords)):
        bar+=1
        bpm=([90,84,72,54][local] if kind=='coda' else 96)
        beatsec=60/bpm;barlen=4*beatsec
        tempo.append({'time':round(now,6),'bpm':bpm})
        harmony.append({'bar':bar,'time':round(now,6),'duration':round(barlen,6),'chord':chord})
        accents.append({'time':round(now,6),'energy':round(energy*(.92 if local%4==3 else 1),3)})
        # Clear just before each bass; catch the harmony after its hammer attack.
        if bar>1:pedals.append({'time':round(now-.025,6),'value':0})
        depth=.80 if kind in ('chorus','chorus2','final') else .74
        if kind=='bridge':depth=.79
        pedals.append({'time':round(now+.065,6),'value':depth})
        if kind in ('chorus','chorus2','final'):
            pedals.extend([{'time':round(now+2*beatsec-.030,6),'value':.15},{'time':round(now+2*beatsec+.060,6),'value':depth}])

        def add(pitch,beat,hold,velocity,hand,role,group=None):
            # Bass speaks first; the sung line sits ~13 ms behind it. A small
            # phrase-shaped timing deviation never changes the metric pulse.
            offset=(.008 if hand=='L' else .021)+(.004 if beat%1 else 0)
            if role=='melody':offset+=.004*math.sin(bar*.8+beat)
            t=now+beat*beatsec+offset
            notes.append({'time':round(t,6),'duration':round(hold*beatsec,6),
                          'midi':pitch,'velocity':round(max(.18,min(.94,velocity)),4),
                          'hand':hand,'finger':0,'role':role,'bar':bar,'beat':beat,
                          'writtenDuration':round(hold*beatsec,6),'group':group})

        melody=phrase(spec)
        mbase={'intro':.52,'verse':.64,'pre':.74,'chorus':.81,'post':.59,'verse2':.67,'pre2':.78,'chorus2':.84,'bridge':.62,'final':.90,'coda':.62}[kind]
        if kind=='coda':mbase-=[0,.05,.10,.18][local]
        for j,(beat,pitch,dur) in enumerate(melody):
            emphasis=.018 if j==0 else (.015 if pitch==max(x[1] for x in melody) else -.018)
            if local%4==3 and j==len(melody)-1:emphasis-=.025
            hold=min(dur*.79,1.12 if kind not in ('intro','bridge','coda') else 1.7)
            if kind=='coda' and local==3:hold=3.6
            add(pitch,beat,hold,mbase+emphasis,'R','melody',f'{bar}:R:{j}')
            # A restrained lower third/sixth on structural arrivals; the sung
            # line remains physically simple and always louder than this voice.
            dyad=(kind in ('chorus','chorus2','final') and j in (0,2) and beat<2.1)
            if dyad:
                pcs={midi(s)%12 for s in [H[chord][0],*H[chord][1]]}
                options=[x for x in range(pitch-7,pitch-2) if x%12 in pcs]
                lower=min(options,key=lambda x:abs(pitch-x-4))
                add(lower,beat,min(hold,.75),mbase-.23,'R','harmony',f'{bar}:R:{j}')
            if kind=='coda' and local==3:
                # Spacious final tonic; no cluster around the RH thumb.
                add(midi('G3'),beat,3.25,.28,'R','harmony',f'{bar}:R:{j}')

        bass=midi(H[chord][0]);upper=list(map(midi,H[chord][1]))
        # Verse patterns breathe; chorus alternates syncopation, eighth notes,
        # and downbeat chords. The pulse comes from piano, with no backing band.
        if kind in ('intro','post'):
            pattern=[(0,[bass],.95),(1.5,upper,.7),(3,[upper[0]],.65)]
        elif kind=='bridge' and local<4:
            pattern=[(0,[bass],1.35),(2,upper,1.2)]
        elif kind=='coda':
            pattern=[(0,[bass],1.2),(1,upper,.9),(2.5,[upper[0]],.9)] if local<3 else [(0,[bass,upper[0]],3.3)]
        elif kind in ('verse','verse2','bridge'):
            variants=[[(0,[bass],.7),(1.5,upper,.55),(2.5,[upper[0]],.55),(3.5,[upper[1]],.30)],
                      [(0,[bass],.7),(1,upper,.58),(2.5,[bass],.5),(3,upper,.55)],
                      [(0,[bass],.75),(.75,[upper[0]],.5),(1.5,[upper[1]],.5),(2.5,upper,.55),(3.5,[upper[0]],.28)],
                      [(0,[bass],.9),(1.5,upper,.65),(2.5,[upper[0]],.55)]]
            pattern=variants[local%4]
        else:
            variants=[[(0,[bass],.55),(.75,upper,.5),(1.5,upper,.28),(2,[bass],.55),(2.75,upper,.5),(3.5,upper,.28)],
                      [(0,[bass],.65),(1,upper,.30),(1.5,[upper[0]],.3),(2,[bass],.55),(2.75,upper,.5),(3.5,[upper[0]],.28)],
                      [(0,[bass],.35),(.5,[upper[0]],.3),(1,[upper[1]],.3),(1.5,[upper[0]],.3),(2,[bass],.35),(2.5,upper,.55),(3.5,[upper[1]],.28)],
                      [(0,[bass],.65),(1,upper,.62),(2.5,upper,.65)]]
            pattern=variants[local%4]
        lbase=mbase-.23
        for gi,(beat,pitches,hold) in enumerate(pattern):
            for pitch in pitches:
                role='bass' if pitch==bass else 'harmony'
                vel=lbase+(.025 if role=='bass' else -.010)+(.025 if kind=='final' else 0)-(.022 if beat%1 else 0)
                add(pitch,beat,hold,vel,'L',role,f'{bar}:L:{gi}')
        now+=barlen
    sections.append({'name':name,'start':round(section_start,6),'end':round(now,6),'energy':energy,'kind':kind})

pedals.append({'time':round(now+.6,6),'value':0})
duration=round(now+3.8,6)
sections[-1]['end']=duration

# Grouped attacks get a dynamic-programming fingering. Close consecutive
# tones use adjacent fingers; repeated tones prefer the same prepared finger.
# Thumbs on black keys are forbidden rather than silently accepted.
for hand in ('L','R'):
    groups=collections.defaultdict(list)
    for n in notes:
        if n['hand']==hand:groups[n['group']].append(n)
    gs=sorted(groups.values(),key=lambda ns:min(n['time'] for n in ns))
    candidates=[]
    for group in gs:
        group.sort(key=lambda n:n['midi']);k=len(group)
        orders=list(itertools.combinations(range(1,6),k))
        if hand=='L':orders=[tuple(reversed(x)) for x in orders]
        options=[]
        for fs in orders:
            if any(f==1 and n['midi']%12 in (1,3,6,8,10) for f,n in zip(fs,group)):continue
            # Thumb axis differs from other fingers; this approximate white-key
            # hand center is only a fingering preference, never a rig trajectory.
            offsets=[(-1 if hand=='R' else 1)*(f-3)*1.70 for f in fs]
            center=sum(n['midi']+o for n,o in zip(group,offsets))/k
            local=sum((n['midi']+o-center)**2 for n,o in zip(group,offsets))*.5
            local+=sum(.08*abs(f-3)+(.7 if f==1 else 0) for f in fs)
            if k==1 and hand=='L':local+=abs(fs[0]-(5 if group[0]['role']=='bass' else 2))*.16
            options.append((fs,center,local))
        candidates.append(options)
    dp=[];parents=[]
    for i,opts in enumerate(candidates):
        costs=[];prevs=[]
        for fs,center,local in opts:
            if i==0:costs.append(local);prevs.append(-1);continue
            timegap=gs[i][0]['time']-gs[i-1][0]['time']
            best=None
            for j,(pf,pc,_) in enumerate(candidates[i-1]):
                travel=(center-pc)**2*.035/max(.3,timegap)
                last=gs[i-1][-1];cur=gs[i][-1]
                motion=(cur['midi']-last['midi'])*(fs[-1]-pf[-1])*(1 if hand=='R' else -1)
                cross=1.4 if motion<0 and abs(cur['midi']-last['midi'])<6 else 0
                repeat=.35 if cur['midi']==last['midi'] and fs[-1]!=pf[-1] else 0
                c=dp[-1][j]+local+travel+cross+repeat
                if best is None or c<best[0]:best=(c,j)
            costs.append(best[0]);prevs.append(best[1])
        dp.append(costs);parents.append(prevs)
    choice=min(range(len(dp[-1])),key=dp[-1].__getitem__)
    for i in range(len(gs)-1,-1,-1):
        fs=candidates[i][choice][0]
        for n,f in zip(gs[i],fs):n['finger']=f
        choice=parents[i][choice]
    # All fingers clear before a new whole-hand grip. This conservatively
    # avoids frozen held intervals while a wrist moves to its next position.
    for i,group in enumerate(gs[:-1]):
        upcoming=gs[i+1];next_t=min(n['time'] for n in upcoming)
        span=abs(sum(n['midi'] for n in upcoming)/len(upcoming)-sum(n['midi'] for n in group)/len(group))
        gap=.060+max(0,span-5)*.010
        for n in group:
            n['duration']=round(min(n['duration'],next_t-gap-n['time']),6)
            assert n['duration']>.065,(n,next_t,gap)

notes.sort(key=lambda n:(n['time'],n['hand'],n['midi']))
for i,n in enumerate(notes):
    n['id']=f'db{i+1:05d}';n.pop('group')
# Authored late voicing: retain established F bass, add its major seventh.
# Applied after deterministic performance so prior timing/fingering stays exact.
voicing=[]
for n in notes:
    if n['bar'] in (36,80) and n['hand']=='L' and n['role']=='harmony' and n['beat']==2.5 and n['midi']==midi('C3'):
        n['midi']=midi('E3');voicing.append(n['id'])
assert voicing==['db00406','db00922'],voicing
for h in harmony:
    if h['bar'] in (36,80): h['chord']='Fmaj7'

score={'title':'Daybreak','bpm':96,'duration':duration,'notes':notes,
       'sections':sections,'pedals':sorted(pedals,key=lambda e:e['time']),
       'accents':accents,'harmony':harmony,'tempoMap':tempo,'accompaniment':[],
       'composition':{'version':'pop-2026-09-06','key':'C major','meter':'4/4','bars':bar,
                      'description':'An original melodic piano-pop song with verses, prechoruses, returning refrain, minor bridge and a rising final refrain.'}}
assert bar==88 and 210<=duration<=240
out=json.dumps(score,separators=(',',':'))+'\n'
(HERE/'score.json').write_text(out)
print(json.dumps({'duration':duration,'notes':len(notes),'sections':sections,
                  'scoreSha256':hashlib.sha256(out.encode()).hexdigest()},indent=2))
