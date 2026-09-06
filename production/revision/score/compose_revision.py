#!/usr/bin/env python3
"""DAYBREAK, second composition. Authored solo piano; Python stdlib only.

Pitches/rhythms and harmonic choices are written measure by measure. Texture
patterns are accompaniment figures, never melody generators. Seconds are the
performed timeline; tempoMap must not be applied a second time by the player.
"""
from __future__ import annotations
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

OUT = Path(__file__).resolve().parent
PC = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def pitch(s):
    return 12*(int(s[-1])+1)+PC[s[0]]+s.count('#')-s.count('b')
def melody(s):
    beat, result = 0., []
    for token in s.split():
        p, d = token.split(':'); d=float(d)
        if p!='r': result.append((beat,d,pitch(p)))
        beat += d
    assert abs(beat-4)<1e-8, (s,beat)
    return result

# Bass plus an independently voiced ascending arpeggio. Color tones stay above
# the bass; upper neighbors are allowed only in the written singing melody.
CHORDS = {
 'Gadd9': ('G2','D3 G3 B3 D4', [7,11,2,9]),
 'Gmaj9': ('G2','D3 G3 B3 F#4', [7,11,2,6,9]),
 'Gmaj7': ('G2','D3 F#3 B3 D4', [7,11,2,6]),
 'G6': ('G2','D3 G3 B3 E4', [7,11,2,4]),
 'G6/9': ('G2','D3 A3 B3 E4', [7,11,2,4,9]),
 'D/F#': ('F#2','D3 F#3 A3 D4', [2,6,9]),
 'Em7': ('E2','B2 E3 G3 D4', [4,7,11,2]),
 'Em9': ('E2','B2 E3 G3 F#4', [4,7,11,2,6]),
 'Cmaj7': ('C3','G3 B3 C4 E4', [0,4,7,11]),
 'Cmaj9': ('C3','G3 B3 D4 E4', [0,4,7,11,2]),
 'Cadd9': ('C3','G3 C4 D4 E4', [0,4,7,2]),
 'C6': ('C3','G3 A3 C4 E4', [0,4,7,9]),
 'G/B': ('B2','D3 G3 B3 D4', [7,11,2]),
 'Am7': ('A2','E3 G3 C4 E4', [9,0,4,7]),
 'Am9': ('A2','E3 G3 B3 C4', [9,0,4,7,11]),
 'Dsus4': ('D3','A3 D4 G4 A4', [2,7,9]),
 'D7sus4': ('D3','A3 C4 D4 G4', [2,7,9,0]),
 'D7': ('D3','A3 C4 D4 F#4', [2,6,9,0]),
 'B7/D#': ('D#3','F#3 A3 B3 D#4', [11,3,6,9]),
 'G/D': ('D3','G3 B3 D4 G4', [7,11,2]),
 'Bm/D': ('D3','F#3 B3 D4 F#4', [11,2,6]),
 'Em/G': ('G2','B2 E3 G3 B3', [4,7,11]),
 'F#ø7': ('F#2','C3 E3 A3 C4', [6,9,0,4]),
 'B7': ('B2','F#3 A3 B3 D#4', [11,3,6,9]),
 'Cm6': ('C3','G3 A3 C4 Eb4', [0,3,7,9]),
 'A7/C#': ('C#3','G3 A3 C#4 E4', [9,1,4,7]),
}

# Each row is (harmony, exact four-beat soprano, accompaniment figure).
# The opening plants the question; the first complete eight-bar sentence begins
# at measure 5. Its identity is D-G-A / G-E-D, with a lower answer and space.
INTRO = [
 ('Gadd9','r:1 D4:.5 G4:.5 A4:1 G4:.5 E4:.5','mist'),
 ('D/F#','D4:1 A4:.5 F#4:.5 E4:1 r:1','mist'),
 ('Em7','B4:1 G4:.5 E4:.5 D4:1 G4:.5 A4:.5','mist'),
 ('Cmaj7','G4:1 E4:.5 D4:.5 G4:1 r:.5 D5:.5','breath'),
]
A = [
 ('Gadd9','D5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1','ripple'),
 ('D/F#','B4:.5 D5:.5 F#5:1 E5:.5 D5:.5 A4:1','ripple_back'),
 ('Em7','E5:.5 G5:.5 B5:1.5 A5:.5 G5:.5 E5:.5','ripple'),
 ('Cmaj9','D5:.5 E5:.5 G5:2 r:.5 E5:.5','breath'),
 ('G/B','D5:.5 G5:.5 A5:1 B5:.5 A5:.5 G5:1','ripple_up'),
 ('Am9','E5:1 D5:.5 B4:.5 C5:1 E5:.5 G5:.5','ripple_back'),
 ('Dsus4','A5:1 G5:.5 E5:.5 D5:1 G5:.5 A5:.5','ripple'),
 ('D7','F#5:1.5 E5:.5 D5:1 r:1','breath'),
 ('Gmaj9','D5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1','ripple_back'),
 ('B7/D#','F#5:1 D#5:.5 B4:.5 A4:.5 B4:.5 D#5:1','ripple'),
 ('Em9','E5:1.5 B5:.5 A5:.5 G5:.5 F#5:.5 E5:.5','ripple_up'),
 ('Cmaj7','G5:2 E5:.5 D5:.5 B4:1','breath'),
 ('Am9','B4:.5 E5:.5 G5:1 E5:.5 D5:.5 C5:1','ripple'),
 ('G/D','B4:1 D5:.5 G5:.5 A5:1 G5:.5 D5:.5','ripple_back'),
 ('D7sus4','E5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1','gather'),
 ('G6','B4:.5 D5:.5 G5:2 r:1','breath'),
]
ASCENT = [
 ('Em7','B4:1 E5:.5 G5:.5 F#5:1 E5:1','ripple'),
 ('Cmaj9','G5:1.5 E5:.5 D5:.5 E5:.5 G5:1','ripple_up'),
 ('G/B','A5:.5 G5:.5 D5:1 G5:1 A5:.5 B5:.5','ripple_back'),
 ('Am9','C6:1 B5:.5 G5:.5 E5:1 r:.5 G5:.5','breath'),
 ('D/F#','A5:1 F#5:.5 E5:.5 D5:.5 F#5:.5 A5:1','gather'),
 ('Gmaj7','B5:1 A5:.5 G5:.5 F#5:1 D5:1','ripple_up'),
 ('Cadd9','E5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:.5 E5:.5','gather'),
 ('D7','F#5:1 E5:.5 D5:.5 A4:1 r:.5 D5:.5','breath'),
]
REFRAIN = [
 ('Gmaj9','D5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1','wide'),
 ('D/F#','B4:.5 D5:.5 F#5:1 E5:.5 D5:.5 A4:1','ripple_back'),
 ('Em7','E5:.5 G5:.5 B5:1.5 A5:.5 G5:.5 E5:.5','wide'),
 ('Cmaj9','D5:.5 E5:.5 G5:2 r:.5 E5:.5','answer'),
 ('Am9','E5:.5 A5:.5 B5:1 A5:.5 G5:.5 E5:1','wide'),
 ('G/B','D5:1 B4:.5 D5:.5 G5:1.5 A5:.5','ripple_up'),
 ('C6','G5:.5 E5:.5 D5:1 E5:.5 G5:.5 A5:1','wide'),
 ('D7','F#5:1.5 E5:.5 D5:1 r:.5 A5:.5','answer'),
 ('Em9','B5:2 A5:.5 G5:.5 E5:.5 G5:.5','wide'),
 ('B7/D#','F#5:.5 B5:.5 A5:1 F#5:.5 D#5:.5 B4:1','ripple_back'),
 ('Cmaj9','E5:.5 G5:.5 D6:1.5 C6:.5 B5:.5 G5:.5','wide'),
 ('D7','A5:1 F#5:.5 E5:.5 D5:1 r:1','breath'),
]
MIDDLE = [
 ('Em9','r:.5 B4:.5 E5:1 F#5:.5 G5:.5 B4:1','still'),
 ('Bm/D','D5:1 F#5:.5 E5:.5 B4:1 r:1','still'),
 ('Cmaj7','E5:1.5 G5:.5 B5:1 G5:.5 E5:.5','broken'),
 ('G/B','D5:2 B4:.5 A4:.5 G4:1','still'),
 ('Am7','C5:.5 E5:.5 A5:1 G5:.5 E5:.5 C5:1','broken'),
 ('Em/G','B4:1.5 G4:.5 E4:1 r:1','still'),
 ('F#ø7','A4:1 C5:.5 E5:.5 F#5:1 E5:.5 C5:.5','broken'),
 ('B7','D#5:1 F#5:.5 A5:.5 B5:1 r:1','breath'),
 ('Em9','G5:1 F#5:.5 E5:.5 B4:1 E5:.5 F#5:.5','ripple'),
 ('Cmaj9','G5:1.5 E5:.5 D5:1 B4:.5 D5:.5','ripple_back'),
 ('Am9','E5:.5 A5:.5 B5:1 G5:.5 E5:.5 D5:1','ripple_up'),
 ('D7','C5:1 E5:.5 F#5:.5 A5:1 r:1','breath'),
]
TURN = [
 ('Cmaj9','G5:1.5 E5:.5 D5:.5 E5:.5 G5:1','still'),
 ('Cm6','G5:1 Eb5:.5 D5:.5 C5:1 A4:1','still'),
 ('G/D','B4:.5 D5:.5 G5:1 A5:.5 B5:.5 D6:1','gather'),
 ('D7','C6:1 A5:.5 F#5:.5 E5:1 r:.5 D5:.5','gather'),
]
FINAL = [
 ('Gadd9','D5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1','wide'),
 ('D/F#','B4:.5 D5:.5 F#5:1 E5:.5 D5:.5 A4:1','wide_back'),
 ('Em9','E5:.5 G5:.5 B5:1.5 A5:.5 G5:.5 E5:.5','wide'),
 ('Cmaj9','D5:.5 E5:.5 G5:2 r:.5 E5:.5','answer'),
 ('Am9','E5:.5 A5:.5 B5:1 A5:.5 G5:.5 E5:1','wide'),
 ('G/B','D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D5:1','wide_back'),
 ('C6','E5:.5 G5:.5 A5:1 C6:1 B5:.5 A5:.5','wide'),
 ('D7','F#5:1 A5:.5 D6:.5 C6:1 r:.5 A5:.5','answer'),
 ('Gmaj9','B5:1.5 A5:.5 G5:.5 D5:.5 G5:.5 A5:.5','wide'),
 ('B7/D#','B5:1 A5:.5 F#5:.5 D#5:1 F#5:.5 A5:.5','wide_back'),
 ('Em9','B5:.5 D6:.5 E6:1.5 D6:.5 B5:.5 G5:.5','wide'),
 ('A7/C#','A5:1 C#6:.5 B5:.5 G5:1 E5:.5 G5:.5','answer'),
 ('Cmaj9','G5:.5 C6:.5 D6:1 B5:.5 G5:.5 E5:1','wide'),
 ('Cm6','Eb5:.5 G5:.5 C6:1 A5:.5 G5:.5 Eb5:1','wide_back'),
 ('G/D','D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D5:1','gather'),
 ('D7','E5:.5 G5:.5 A5:1 F#5:1 r:1','breath'),
]
CODA = [
 ('Gmaj9','D5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1','ripple'),
 ('D/F#','B4:.5 D5:.5 F#5:1 E5:.5 D5:.5 A4:1','ripple_back'),
 ('Em7','E5:1.5 G5:.5 B5:1 G5:.5 E5:.5','fall'),
 ('Cmaj7','D5:.5 E5:.5 G5:2 r:1','still'),
 ('Cm6','G4:1 Eb5:.5 D5:.5 C5:1 A4:1','still'),
 ('G/D','B4:1 D5:.5 G5:.5 D5:1 B4:1','fall'),
 ('D7','A4:1 G4:1 F#4:1 r:.5 D4:.5','last_dominant'),
 ('G6/9','G4:4','last'),
]
FORM = [
 ('First light', INTRO, 'intro', .28),
 ('A window opens', A, 'theme', .56),
 ('A little farther', ASCENT, 'ascent', .69),
 ('Daybreak', REFRAIN, 'refrain', .82),
 ('What the night kept', MIDDLE, 'middle', .44),
 ('The light returns', TURN, 'turn', .62),
 ('Everything opens', FINAL, 'final', .98),
 ('Home in the light', CODA, 'coda', .38),
]
ROWS=[row for _,rows,_,_ in FORM for row in rows]
assert len(ROWS)==80
MELODIES=[melody(row[1]) for row in ROWS]

# Countervoice lines are engraved independently of the melody. They answer
# during held soprano notes or rests; their quieter dynamics preserve hierarchy.
# Values: beat, duration in beats, pitch. Bars are one-based.
COUNTER = {
 8: [(1.5,.5,'B4'),(2,.5,'D5'),(2.5,.55,'E5')],
 12:[(3,.45,'A4'),(3.5,.40,'C5')],
 16:[(.5,.5,'B4'),(1,.5,'D5'),(1.5,.45,'E5')],
 20:[(1.5,.5,'B4'),(2,.5,'D5'),(2.5,.6,'E5')],
 24:[(2.6,.4,'C5'),(3,.42,'A4')],
 32:[(1.5,.5,'B4'),(2,.5,'D5'),(2.5,.55,'E5')],
 36:[(2.1,.4,'B4'),(2.6,.4,'A4'),(3.1,.35,'C5')],
 37:[(.5,.5,'E5'),(1,.5,'G5'),(1.5,.45,'A5')],
 43:[(.5,.5,'G4'),(1,.4,'B4')],
 44:[(.5,.5,'G4'),(1,.5,'B4'),(1.5,.42,'A4')],
 48:[(3,.45,'F#5'),(3.5,.40,'D#5')],
 53:[(.5,.5,'B4'),(1,.42,'D5')],
 60:[(1.5,.5,'B4'),(2,.5,'D5'),(2.5,.55,'E5')],
 64:[(2.1,.4,'F#5'),(2.6,.4,'A5'),(3.1,.3,'F#5')],
 65:[(.5,.5,'D5'),(1,.42,'G5')],
 67:[(1.5,.5,'G5'),(2,.5,'B5')],
 68:[(2.1,.4,'C#5'),(2.6,.4,'E5'),(3.1,.30,'C#5')],
 76:[(1.5,.5,'B4'),(2,.5,'D5'),(2.5,.5,'E5')],
}

# Tempo is a phrase-shaped curve, not random humanization. Breaths at the last
# measure of each sentence lengthen it; the following sentence moves naturally.
BASE_TEMPOS = [78]*4 + [86]*16 + [87]*8 + [88]*12 + [82]*8+[84]*4+[82,80,86,84]+[90]*16+[84,82,80,77,73,69,63,54]
assert len(BASE_TEMPOS)==80
BAR_BPM=[]
for b,tempo in enumerate(BASE_TEMPOS):
    if b<72: tempo += [0,1,0,-3][b%4]
    BAR_BPM.append(tempo)
BAR_TIME=[0.]
for bpm in BAR_BPM: BAR_TIME.append(BAR_TIME[-1]+240/bpm)
def seconds(bar,beat=0): return BAR_TIME[bar]+beat*60/BAR_BPM[bar]

# Ordered attacks: beat and arpeggio index, 0 being the bass. Pattern endpoints
# vary; the top of the accompaniment is deliberately absent in quiet figures.
PATTERNS={
 'mist':[(0,0),(1.5,1),(2.5,2),(3.5,3)],
 'breath':[(0,0),(.5,1),(1,2),(1.5,3),(2.5,2)],
 'ripple':[(0,0),(.5,1),(1,2),(1.5,3),(2,4),(2.5,3),(3,2),(3.5,1)],
 'ripple_back':[(0,0),(.5,1),(1,3),(1.5,2),(2,4),(2.5,3),(3,1),(3.5,2)],
 'ripple_up':[(0,0),(.5,1),(1,2),(1.5,3),(2,1),(2.5,2),(3,3),(3.5,4)],
 'gather':[(0,0),(.5,1),(1,2),(1.5,3),(2,0),(2.5,1),(3,2),(3.5,3)],
 'wide':[(0,-1),(.5,1),(1,2),(1.5,3),(2,4),(2.5,3),(3,2),(3.5,1)],
 'wide_back':[(0,-1),(.5,1),(1,3),(1.5,2),(2,4),(2.5,3),(3,1),(3.5,2)],
 'answer':[(0,-1),(.5,1),(1,2),(1.5,3),(2.5,1),(3,2)],
 'broken':[(0,0),(.75,1),(1.5,3),(2.5,2),(3.5,1)],
 'still':[(0,0),(1.5,2),(2.5,3)],
 'fall':[(0,0),(.5,1),(1,3),(2,2),(3,1)],
 'last_dominant':[(0,0),(1,1),(2,2)],
 'last':[(0,-2)],
}

notes=[]; pedals=[]; accents=[]; sections=[]; requests=[]
section_for_bar={}
b=0
for name,rows,kind,energy in FORM:
    sections.append(dict(name=name,start=round(BAR_TIME[b],6),end=round(BAR_TIME[b+len(rows)],6),energy=energy,kind=kind,firstBar=b+1,bars=len(rows)))
    for j in range(len(rows)): section_for_bar[b+j]=(kind,energy,j,len(rows))
    b+=len(rows)

def request(bar,beat,duration,keys,vel,hand,role,preferred=None):
    """One intentional simultaneous grip, with a small performed chord roll."""
    kind,energy,j,length=section_for_bar[bar]
    # Rubato is in bar length; these small offsets give the melody its own breath.
    delay=.012 if hand=='L' else .025
    if hand=='L' and beat==0: delay=0
    if hand=='R' and beat%1==.5: delay+=.009
    if role=='countermelody': delay+=.009
    t=seconds(bar,beat)+delay
    end=seconds(bar,beat+duration)+delay-.016
    requests.append(dict(time=t,end=end,keys=sorted(keys),velocity=vel,hand=hand,role=role,bar=bar+1,beat=beat,preferred=preferred))

def voiced_under(m,pcs,count):
    # Favor consonant thirds/sixths and omit a major 7th or minor 9th under tune.
    choices=[p for p in range(m-12,m-2) if p%12 in pcs and (m-p)%12 not in (1,11)]
    chosen=[]
    for target in ([m-9,m-5] if count==2 else [m-7]):
        valid=[p for p in choices if all(abs(p-v)>=3 for v in chosen)]
        if valid: chosen.append(min(valid,key=lambda p:abs(p-target)))
    return sorted(chosen)

for bar,((chord_name,notation,pattern),events) in enumerate(zip(ROWS,MELODIES)):
    kind,energy,j,length=section_for_bar[bar]
    bass,arps,pcs=CHORDS[chord_name]; bass=pitch(bass)
    arp=[bass]+[pitch(p) for p in arps.split()]
    dynamic={'intro':.57,'theme':.70,'ascent':.75,'refrain':.80,'middle':.65,'turn':.68,'final':.86,'coda':.70}[kind]
    if kind=='theme' and j>=8: dynamic+=.015
    if kind=='middle': dynamic += .035 if j>=8 else -.012*j/7
    if kind=='turn': dynamic += .035*j
    if kind=='final': dynamic += [.00,.015,.045,.015][j//4]
    if kind=='coda': dynamic -= .035*j
    dynamic += [0,.007,.012,-.023][j%4]
    unique=sorted({m for _,_,m in events})
    local_shapes={1:[3],2:[2,4],3:[1,3,5],4:[1,2,3,4],5:[1,2,3,4,5],6:[1,2,3,1,3,5],7:[1,2,3,1,2,3,5]}
    melodic_fingers=dict(zip(unique,local_shapes[len(unique)]))
    for k,(beat,dur,m) in enumerate(events):
        # Quiet phrases use varied melodic fingers. Fuller grips place the tune
        # on 5, as in ordinary voiced piano writing. Holds are independent of pedal.
        is_counter_bar=bar+1 in COUNTER
        support=(kind in ('refrain','final') and (beat==0 or dur>=1.5)) or (kind=='ascent' and beat==0)
        backing=voiced_under(m,pcs,2 if kind=='final' else 1) if support else []
        if kind=='coda' and j==7: backing=[pitch('A3'),pitch('B3'),pitch('E4')]
        vel=dynamic + (.024 if dur>=1 else -.006) + .008*(m-79)/12
        if k==len(events)-1 and dur>=1: vel-=.033
        # No support shares the scarce low register with the opposite hand.
        backing=[p for p in backing if p>=60 and p>max(arp)]
        if kind=='coda' and j==7: backing=[57,59,64]
        request(bar,beat,dur,[m],vel,'R','melody',5 if backing or is_counter_bar else melodic_fingers[m])
        if backing:
            request(bar,beat,min(dur,.68 if kind!='coda' else 3.9),backing,vel-.22,'R','harmony')
    for beat,dur,p in COUNTER.get(bar+1,[]):
        request(bar,beat,dur,[pitch(p)],dynamic-.135,'R','countermelody')
    pattern_events=PATTERNS[pattern]
    for idx,(beat,arp_idx) in enumerate(pattern_events):
        if arp_idx==-1: keys=[bass,bass+12]
        elif arp_idx==-2: keys=[43,50,55]
        else: keys=[arp[arp_idx]]
        nextbeat=pattern_events[idx+1][0] if idx+1<len(pattern_events) else 4
        dur=nextbeat-beat
        if kind=='coda' and j==7: dur=3.94
        lhvel=dynamic-.245 + (.043 if beat==0 else 0) - .012*(idx%3)
        if kind=='final' and beat==0: lhvel+=.025
        request(bar,beat,dur,keys,lhvel,'L','bass' if beat==0 else 'harmony',{0:5,1:3,2:2,3:1,4:2}.get(arp_idx))
    # Catch harmony after the downbeat; clear every bar. Half-pedaling limits
    # eighth-note buildup, with another clean breath in the fullest measures.
    if bar: pedals.append(dict(time=round(seconds(bar)-.024,6),value=0))
    depth=.66 if kind in ('refrain','final') else .73
    if kind in ('intro','middle','coda'): depth=.79
    pedals.append(dict(time=round(seconds(bar)+.067,6),value=depth))
    if kind in ('refrain','final') and j%4 in (0,2):
        pedals += [dict(time=round(seconds(bar,1.99),6),value=0),dict(time=round(seconds(bar,2.08),6),value=depth)]
    if kind=='coda' and j==6:
        pedals += [dict(time=round(seconds(bar,1.96),6),value=0),dict(time=round(seconds(bar,2.07),6),value=.58)]
    accents.append(dict(time=round(seconds(bar),6),energy=round(energy*(1 if j%4==0 else .52),3)))

# A performance planner enforces mechanics on actual key holds. It never changes
# a written pitch, attack or melody duration in beats. Acoustic lengths are
# carried by the pedal; physical holds can end early to permit register travel.
def travel_gap(old_keys,new_keys):
    # Translational distance between grip centers. Wide shifts need more time;
    # local finger changes get 24 ms. 24-semitone translation gets 170 ms.
    distance=abs(sum(old_keys)/len(old_keys)-sum(new_keys)/len(new_keys))
    return .024 if distance<=7 else .024+(distance-7)*.0086

planner_trims=[]
for hand in ('L','R'):
    groups=defaultdict(list)
    for r in requests:
        if r['hand']==hand: groups[round(r['time'],6)].append(r)
    active=[]
    last_keys=None
    # Each simultaneous group is fused before assigning a physically ordered grip.
    for t,rs in sorted(groups.items()):
        incoming=[]
        for r in rs:
            for p in r['keys']:
                incoming.append(dict(midi=p,end=r['end'],role=r['role'],velocity=r['velocity'],bar=r['bar'],beat=r['beat'],preferred=r['preferred']))
        incoming.sort(key=lambda x:x['midi'])
        assert len({x['midi'] for x in incoming})==len(incoming), ('duplicate authored attack',hand,t,incoming)
        newkeys=[n['midi'] for n in incoming]
        # At a new melody onset, the preceding melody/fill has released; retain
        # a held soprano over a countervoice only when the grip permits it.
        has_melody=any(n['role']=='melody' for n in incoming)
        overlap=[n for n in active if n['time']+n['duration']>t-.000001]
        keep=[]
        for n in overlap:
            if hand=='R' and not has_melody and n['role']=='melody' and n['midi']>max(newkeys) and n['midi']-min(newkeys)<=12:
                keep.append(n)
            else:
                gap=travel_gap([n['midi']],newkeys)
                end=min(n['time']+n['duration'],t-gap)
                if end<n['time']+.055: end=n['time']+.055
                planner_trims.append((n['id'],n['time']+n['duration']-end,'overlap/travel'))
                n['duration']=end-n['time']
        # Include prior released grip for required airborne translation. Clamp
        # the previous attack's physical duration early enough for the new grip.
        moveable=[n for n in active if n not in keep]
        if moveable:
            prior_time=max(n['time'] for n in moveable)
            prior=[n for n in moveable if abs(n['time']-prior_time)<.020]
            prior_keys=[n['midi'] for n in prior]
            gap=travel_gap(prior_keys,newkeys)
            for n in prior:
                end=min(n['time']+n['duration'],t-gap)
                if end<n['time']+.055:
                    raise ValueError(('unplayable quick travel',hand,t,n,newkeys,gap))
                if end<n['time']+n['duration']:
                    planner_trims.append((n['id'],n['time']+n['duration']-end,'airborne travel'))
                    n['duration']=end-n['time']
        occupied={n['finger'] for n in keep}
        available=[f for f in range(1,6) if f not in occupied]
        if hand=='L':
            mapping={1:[3],2:[5,1],3:[5,3,1],4:[5,4,2,1],5:[5,4,3,2,1]}
            fingers=[incoming[0]['preferred']] if len(incoming)==1 and incoming[0]['preferred'] else mapping[len(incoming)]
        elif keep:
            fingers={1:[2],2:[1,3],3:[1,2,3],4:[1,2,3,4]}[len(incoming)]
        elif len(incoming)>1:
            fingers={2:[1,5],3:[1,3,5],4:[1,2,3,5],5:[1,2,3,4,5]}[len(incoming)]
        elif incoming[0]['preferred']:
            fingers=[incoming[0]['preferred']]
        else:
            # Local five-note hand positions, shifted at a natural release.
            pos=incoming[0]['midi']%12
            fingers=[{0:1,1:2,2:2,3:3,4:3,5:4,6:4,7:5,8:3,9:4,10:3,11:2}[pos]]
        for i,(n,f) in enumerate(zip(incoming,fingers)):
            start=t + .0035*i if len(incoming)>1 else t
            d=max(.055,n['end']-start)
            note=dict(id=f'p{len(notes)+1:05d}',time=start,duration=d,midi=n['midi'],velocity=max(.16,min(.95,n['velocity'])),hand=hand,finger=f,role=n['role'],bar=n['bar'],beat=n['beat'])
            notes.append(note)
        active=keep + notes[-len(incoming):]

for n in notes:
    n['time']=round(n['time'],6); n['duration']=round(n['duration'],6); n['velocity']=round(n['velocity'],4)
notes.sort(key=lambda n:(n['time'],n['midi']))
for i,n in enumerate(notes): n['id']=f'p{i+1:05d}'
pedals.append(dict(time=round(BAR_TIME[-1]+1.10,6),value=0))
duration=round(BAR_TIME[-1]+4.15,6)
sections[-1]['end']=duration
pedals.sort(key=lambda x:x['time'])
score=dict(title='DAYBREAK',version='lyrical-piano-2',composer='Original composition for this experience',bpm=BAR_BPM[0],duration=duration,meter=[4,4],key='G major · E minor middle · G major return',notes=notes,sections=sections,pedals=pedals,accents=accents,accompaniment=[],harmony=[dict(bar=b+1,time=round(BAR_TIME[b],6),duration=round(BAR_TIME[b+1]-BAR_TIME[b],6),chord=row[0]) for b,row in enumerate(ROWS)],tempoMap=[dict(time=round(BAR_TIME[b],6),bpm=BAR_BPM[b]) for b in range(80) if b==0 or BAR_BPM[b]!=BAR_BPM[b-1]],performance=dict(noteDurations='Physical key holds. Sustain is controlled by independent pedal events.',timing='Written phrase rubato and a lightly delayed singing voice. Timestamps already contain the complete performance.',pianoPriority='Solo grand only. Melody at the foreground; countervoice and broken harmony are intentionally quieter.',tail='Final G6/9, pedal release, then 3.05 seconds of resonance.',benchmark='The requested reference is a quality target only. Melody and arrangement are original.'),composition=dict(theme='D–G–A, G–E–D; upward question with a falling answer',themeBars=[5,13,29,57,73],climaxBar=67,accompanimentFigures=len(PATTERNS)))

def validate(data):
    errors=[]; ns=data['notes']
    required={'time','duration','midi','velocity','hand','finger','role'}
    if not 210<=data['duration']<=270: errors.append('runtime outside 3.5–4.5 minutes')
    if len({n['id'] for n in ns})!=len(ns): errors.append('duplicate IDs')
    for n in ns:
        if not required.issubset(n): errors.append('missing required note fields')
        if not all(math.isfinite(n[k]) for k in ('time','duration','velocity')): errors.append('nonfinite event')
        if not (0<=n['time']<n['time']+n['duration']<=data['duration'] and n['duration']>=.05): errors.append(f"timing {n['id']}")
        if not 0<n['velocity']<=1 or not 21<=n['midi']<=108: errors.append(f"pitch/velocity {n['id']}")
        if n['hand'] not in ('L','R') or n['finger'] not in range(1,6): errors.append(f"finger {n['id']}")
    events=[]
    for n in ns: events.extend([(n['time'],1,n),(round(n['time']+n['duration'],6),0,n)])
    active={}; poly={'L':0,'R':0}; spans={'L':0,'R':0}; held_snapshots=0
    for t,kind,n in sorted(events,key=lambda e:(e[0],e[1])):
        if not kind: active.pop(n['id'],None); continue
        active[n['id']]=n; held_snapshots+=1
        if any(v>1 for v in Counter(x['midi'] for x in active.values()).values()): errors.append(f'duplicate key at {t:.6f}')
        for h in ('L','R'):
            held=sorted([x for x in active.values() if x['hand']==h],key=lambda x:x['midi'])
            span=held[-1]['midi']-held[0]['midi'] if held else 0
            poly[h]=max(poly[h],len(held)); spans[h]=max(spans[h],span)
            fs=[x['finger'] for x in held]
            if len(held)>5: errors.append(f'{h} >5 keys at {t:.6f}')
            if span>12: errors.append(f'{h} >octave span {span} at {t:.6f}')
            if len(fs)!=len(set(fs)): errors.append(f'{h} finger overlap at {t:.6f}')
            if fs!=sorted(fs,reverse=h=='L'): errors.append(f'{h} unordered fingers at {t:.6f}')
    # Independently regroup performed attacks (including 3.5-ms chord rolls).
    travel_checks=0; wide_shifts=[]; min_margin=10
    for h in ('L','R'):
        attacks=[]
        for n in [x for x in ns if x['hand']==h]:
            if attacks and n['time']-attacks[-1][0]['time']<.013: attacks[-1].append(n)
            else: attacks.append([n])
        for prev,nxt in zip(attacks,attacks[1:]):
            old=[n['midi'] for n in prev]; new=[n['midi'] for n in nxt]
            dist=abs(sum(old)/len(old)-sum(new)/len(new))
            # Moving countervoice under a retained soprano is not a whole-hand
            # translation; simultaneous-span/finger checks govern that case.
            if any(n['time']+n['duration']>nxt[0]['time'] for n in prev): continue
            actual=nxt[0]['time']-max(n['time']+n['duration'] for n in prev)
            needed=travel_gap(old,new)
            travel_checks+=1; min_margin=min(min_margin,actual-needed)
            if actual+0.000003<needed: errors.append(f'{h} inadequate travel gap at {nxt[0]["time"]:.6f}: {actual:.6f} < {needed:.6f}')
            if dist>12: wide_shifts.append(dict(hand=h,time=round(nxt[0]['time'],6),distance=round(dist,2),requiredGap=round(needed,6),actualGap=round(actual,6)))
    if any(abs(a['end']-b['start'])>1e-5 for a,b in zip(sections,sections[1:])): errors.append('section discontinuity')
    if pedals[-1]['value']!=0: errors.append('pedal not released')
    if not data['harmony'][-1]['chord']=='G6/9': errors.append('no tonic ending')
    if data['duration']-pedals[-1]['time']<3: errors.append('tail too short')
    exact_reprises=[b for b in (13,29,57,73) if MELODIES[b-1]==MELODIES[4]]
    if len(exact_reprises)<4: errors.append('theme identity lost')
    counter_checks=0
    for b,cs in COUNTER.items():
        for beat,d,p in cs:
            sustaining=[(t,dd,m) for t,dd,m in MELODIES[b-1] if t<=beat<t+dd]
            if sustaining:
                counter_checks+=1
                t,dd,m=sustaining[0]
                if not 1<=m-pitch(p)<=12: errors.append(f'countervoice cannot sit below held soprano: bar {b}, beat {beat}')
                lead=[n for n in ns if n['bar']==b and n['role']=='melody' and abs(n['beat']-t)<.0001][0]
                counter=[n for n in ns if n['bar']==b and n['role']=='countermelody' and abs(n['beat']-beat)<.0001][0]
                if lead['time']+lead['duration']<counter['time']+.02: errors.append(f'countervoice truncated held soprano: bar {b}, beat {beat}')
    roles=Counter(n['role'] for n in ns)
    return dict(passed=not errors,duration=data['duration'],bars=80,sections=len(sections),pianoNotes=len(ns),accompanimentEvents=0,pitchRange=[min(n['midi'] for n in ns),max(n['midi'] for n in ns)],roles=dict(roles),maxPhysicalPolyphony=poly,maxPhysicalSpanSemitones=spans,physicalSnapshotsChecked=held_snapshots,travelChecks=travel_checks,wideShifts=len(wide_shifts),minimumTravelMargin=round(min_margin,6),widestTravel=max(wide_shifts,key=lambda x:x['distance']),wideShiftEvidence=wide_shifts,countervoiceSustainChecks=counter_checks,exactThemeReturnBars=exact_reprises,uniqueMelodyMeasures=len({tuple(m) for m in MELODIES}),uniqueHarmonies=len(set(r[0] for r in ROWS)),accompanimentFigures=len(PATTERNS),melodyVelocityMean=round(sum(n['velocity'] for n in ns if n['role']=='melody')/roles['melody'],4),supportVelocityMean=round(sum(n['velocity'] for n in ns if n['role']=='harmony')/roles['harmony'],4),lastKeyRelease=round(max(n['time']+n['duration'] for n in ns),6),lastPedalRelease=pedals[-1]['time'],auditoryValidation='Not performed: no listening claim. Score and physical timeline verified.',errors=sorted(set(errors)))

report=validate(score)
(OUT/'score.json').write_text(json.dumps(score,separators=(',',':'))+'\n')
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
(OUT/'VALIDATION.md').write_text('# DAYBREAK revision validation — '+('PASS' if report['passed'] else 'FAIL')+'\n\n'+ '\n'.join(f'- **{k}:** {v}' for k,v in report.items() if k not in ('wideShiftEvidence','errors'))+'\n\nTravel rule: 24 ms for grip-center motion up to seven semitones, then 8.6 ms per additional semitone. Physical releases are brought forward while the pedal carries resonance. Every performed attack transition is checked independently, except countervoice motion under a retained soprano, which is governed by the simultaneous octave/finger checks. Full wide-shift evidence is in `validation.json`.\n\nErrors: '+('None.' if not report['errors'] else '\n'+ '\n'.join(report['errors']))+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='wideShiftEvidence'},indent=2))
if not report['passed']: raise SystemExit(1)
