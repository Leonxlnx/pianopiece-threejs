#!/usr/bin/env python3
"""DAYBREAK — original composition, deterministic performance and validation.

All melody and harmony below are authored measure by measure. No random note,
rhythm, velocity or timing generation is used. The little timing departures are
fixed musical gestures: the bass leads a full refrain, the tune leans behind it,
and a phrase ending takes a breath. The file may be rerun with Python 3 alone.
"""
from __future__ import annotations
import json
import math
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent
BPM = 100
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def pitch(s):
    name, octave = s[:-1], int(s[-1])
    return (octave + 1) * 12 + PC[name[0]] + name.count('#') - name.count('b')

def line(s):
    """Compact engraved melody: pitch:beat-duration, r:rest-duration."""
    t, result = 0.0, []
    for token in s.split():
        name, duration = token.split(':')
        d = float(duration)
        if name != 'r':
            result.append((t, d, pitch(name)))
        t += d
    assert abs(t-4) < 1e-7, (s, t)
    return result

# [bass MIDI, pitch classes, left-hand shell]. Shells are deliberately spread
# within an octave/10th, below the melody; the added color often lives in RH.
CHORDS = {
    'Dadd9': (38, [2,6,9,4], [50,54,57]),
    'D/F#': (42, [2,6,9,4], [50,57]),
    'Gmaj9': (43, [7,11,2,6,9], [50,54,59]),
    'A/C#': (37, [9,1,4,11], [49,52,57]),
    'Bm7': (35, [11,2,6,9], [50,54,57]),
    'Bm9': (35, [11,2,6,9,1], [49,50,54]),
    'Em9': (40, [4,7,11,2,6], [50,55,59]),
    'A13': (33, [9,1,4,7,11,6], [49,55,59]),
    'F#7/A#': (34, [6,10,1,4], [49,52,58]),
    'G6': (43, [7,11,2,4], [50,52,59]),
    'Asus': (33, [9,2,4,7], [50,55,57]),
    'A7': (33, [9,1,4,7], [49,55,57]),
    'Bm/A': (33, [11,2,6,9], [50,54,59]),
    'G/D': (38, [7,11,2,6,9], [50,55,59]),
    'Cadd9': (36, [0,4,7,2], [48,52,55]),
    'F#7': (42, [6,10,1,4], [49,52,58]),
    'E7/G#': (44, [4,8,11,2], [50,56,59]),
    'B7': (35, [11,3,6,9], [51,54,57]),
    'Eadd9': (40, [4,8,11,6], [52,56,59]),
    'E/G#': (44, [4,8,11,6], [52,59]),
    'B/D#': (39, [11,3,6,1], [51,54,59]),
    'C#m7': (37, [1,4,8,11], [52,56,59]),
    'C#m9': (37, [1,4,8,11,3], [51,52,56]),
    'Amaj9': (33, [9,1,4,8,11], [49,56,59]),
    'F#m9': (42, [6,9,1,4,8], [49,52,57]),
    'A6': (33, [9,1,4,6], [49,52,54]),
    'B13': (35, [11,3,6,9,1,8], [49,51,57]),
    'G#7/C': (36, [8,0,3,6], [48,51,56]),
    'Am6': (33, [9,0,4,6], [48,52,54]),
    'E/B': (35, [4,8,11,6], [52,56,59]),
    'B7sus4–3': (35, [11,4,3,6,9], [51,54,57]),
    'E6/9': (40, [4,8,11,1,6], [52,56,59]),
}

FORM = [
    ('First light', 4, 'intro', .25),
    ('A quiet beginning', 12, 'verse', .39),
    ('Toward the horizon', 8, 'ascent', .61),
    ('Daybreak', 12, 'chorus', .83),
    ('Afterglow', 4, 'interlude', .42),
    ('The road behind', 8, 'verse2', .49),
    ('One more breath', 4, 'ascent2', .72),
    ('Daybreak · reprise', 8, 'reprise', .86),
    ('Before the sun', 8, 'bridge', .40),
    ('Everything opens', 16, 'final', 1.0),
    ('Home in the light', 8, 'coda', .34),
]

HARMONY = [
    # Intro: the signature descent appears without completing its refrain.
    'Dadd9','D/F#','Gmaj9','Asus',
    # Verse I: bass motion and a secondary dominant, not a repeated cycle.
    'Dadd9','D/F#','Gmaj9','A/C#','Bm7','F#7/A#','Gmaj9','Em9',
    'D/F#','Em9','Asus','A7',
    # Ascent: borrowed bVII opens the harmonic field before V.
    'Bm7','Gmaj9','D/F#','Em9','Cadd9','G/D','A13','A7',
    # Refrain: twelve-bar narrative, three differently harmonized sentences.
    'Dadd9','A/C#','Bm7','Gmaj9','Em9','D/F#','G6','A13',
    'Bm9','F#7/A#','Gmaj9','Dadd9',
    # Interlude; inward second verse in the relative minor.
    'D/F#','Gmaj9','Em9','A7',
    'Bm9','Bm/A','Gmaj9','D/F#','Em9','F#7','Bm7','A7',
    # Compressed ascent and refrain II.
    'Cadd9','G/D','A13','A7',
    'Dadd9','A/C#','Bm7','Gmaj9','Em9','D/F#','G6','A13',
    # Breakdown: chromatic descending bass, then F#7 -> B7 -> E.
    'Bm7','F#7/A#','Bm/A','E7/G#','Gmaj9','Em9','F#7','B7',
    # Refrain lifted to E; the four-bar extension is newly composed.
    'Eadd9','B/D#','C#m7','Amaj9','F#m9','E/G#','A6','B13',
    'C#m9','G#7/C','Amaj9','Eadd9','Amaj9','Am6','E/B','B7',
    # Coda: modal iv color, a final suspension and a completed tonic.
    'Eadd9','B/D#','C#m7','Amaj9','Am6','E/G#','B7sus4–3','E6/9',
]

INTRO = [
    'r:1 F#4:.75 E4:.25 D4:1 F#4:.5 A4:.5',
    'E5:1 D5:.5 A4:.5 F#4:1 r:1',
    'B4:.75 A4:.25 F#4:.5 D4:.5 E4:1 D4:.5 r:.5',
    'E4:1 A4:.5 B4:.5 D5:1 r:1',
]
VERSE = [
    'r:.5 F#4:.5 A4:.75 F#4:.25 E4:.5 D4:.5 E4:.5 F#4:.5',
    'A4:1 F#4:.5 E4:.5 D4:1 r:1',
    'G4:.75 A4:.25 B4:1 A4:.5 F#4:.5 D4:.5 r:.5',
    'E4:.5 F#4:.5 A4:1 B4:.75 A4:.25 E4:.5 r:.5',
    'F#4:.5 B4:1 A4:.5 F#4:.75 E4:.25 D4:.5 r:.5',
    'E4:.5 F#4:.5 A#4:.75 C#5:.25 B4:.5 A#4:.5 F#4:.5 E4:.5',
    'D5:1 B4:.5 A4:.5 F#4:1 A4:.5 r:.5',
    'G4:.5 F#4:.5 E4:1 B4:.75 A4:.25 G4:.5 r:.5',
    'F#4:.75 E4:.25 D4:.5 E4:.5 F#4:.5 A4:.5 D5:.5 C#5:.5',
    'B4:1 G4:.5 F#4:.5 E4:1 D4:.5 r:.5',
    'A4:1 B4:.5 D5:.5 E5:.75 D5:.25 B4:.5 A4:.5',
    'C#5:1 E5:.5 D5:.5 C#5:1 r:.5 E5:.5',
]
ASCENT = [
    'F#5:.75 E5:.25 D5:.5 B4:.5 F#5:1 E5:.5 D5:.5',
    'G5:1 F#5:.5 D5:.5 B4:1 D5:.5 E5:.5',
    'F#5:1 A5:.5 F#5:.5 E5:.75 D5:.25 A4:.5 r:.5',
    'G5:.75 F#5:.25 E5:1 B4:.5 D5:.5 E5:.5 F#5:.5',
    'G5:1 E5:.5 D5:.5 C5:.75 D5:.25 E5:.5 G5:.5',
    'A5:1 F#5:1 D5:.5 E5:.5 F#5:.5 G5:.5',
    'A5:1 E5:.5 F#5:.5 G5:1 F#5:.5 E5:.5',
    'C#5:.5 D5:.5 E5:1 A4:.75 r:.25 E5:.5 F#5:.5',
]
HOOK = [
    'F#5:.75 E5:.25 D5:.5 F#5:.5 A5:1.5 F#5:.5',
    'E5:1 D5:.5 C#5:.5 B4:.75 C#5:.25 E5:.75 r:.25',
    'F#5:.75 E5:.25 D5:1 F#5:.5 E5:.5 D5:.5 B4:.5',
    'B4:.5 D5:.5 E5:1 D5:1.5 r:.5',
    'G5:.75 F#5:.25 E5:.5 G5:.5 B5:1 G5:.5 F#5:.5',
    'F#5:1 E5:.5 D5:.5 A4:1 D5:.5 F#5:.5',
    'G5:.75 F#5:.25 E5:1 D5:.5 E5:.5 G5:.5 A5:.5',
    'F#5:1 E5:.5 C#5:.5 B4:1 A4:.5 r:.5',
    'F#5:.5 A5:.5 B5:1 A5:.5 F#5:.5 E5:.5 D5:.5',
    'E5:.75 F#5:.25 A#5:1 C#6:.5 B5:.5 A#5:.5 F#5:.5',
    'B5:1 A5:.5 F#5:.5 D5:.75 E5:.25 F#5:.5 A5:.5',
    'F#5:.75 E5:.25 D5:2 r:1',
]
INTERLUDE = [
    'r:.5 A4:.5 F#4:1 E4:.5 D4:.5 A4:.5 F#4:.5',
    'B4:1 A4:.5 F#4:.5 D4:1 r:1',
    'E4:.75 F#4:.25 G4:1 B4:.5 A4:.5 G4:.5 E4:.5',
    'C#5:1 B4:.5 A4:.5 E4:1 r:1',
]
VERSE2 = [
    'r:.5 F#4:.5 B4:.75 A4:.25 F#4:1 D4:.5 F#4:.5',
    'A4:.75 B4:.25 D5:1 C#5:.5 B4:.5 A4:.5 r:.5',
    'B4:1 D5:.5 F#5:.5 E5:.75 D5:.25 B4:.5 A4:.5',
    'F#4:.5 A4:.5 D5:1 A4:.5 F#4:.5 E4:.5 r:.5',
    'G4:.75 F#4:.25 E4:.5 G4:.5 B4:1 D5:.5 E5:.5',
    'C#5:.75 A#4:.25 F#4:1 E4:.5 F#4:.5 A#4:.5 C#5:.5',
    'D5:1 F#5:.5 E5:.5 D5:.75 C#5:.25 B4:.5 F#4:.5',
    'E5:1 C#5:.5 B4:.5 A4:1 r:.5 E5:.5',
]
ASCENT2 = [
    'G5:.75 E5:.25 D5:.5 C5:.5 E5:1 G5:.5 A5:.5',
    'B5:1 A5:.5 F#5:.5 D5:1 F#5:.5 G5:.5',
    'A5:.75 G5:.25 F#5:.5 E5:.5 C#5:.5 E5:.5 G5:.5 A5:.5',
    'E5:1 C#5:.5 D5:.5 E5:1 r:.5 F#5:.5',
]
# The reprise begins more intimately, then rejoins the recognizable hook.
REPRISE = [
    'F#5:.75 E5:.25 D5:.5 F#5:.5 A5:1 F#5:.5 E5:.5',
    'E5:1 C#5:.5 B4:.5 A4:.75 B4:.25 C#5:.75 r:.25',
    'F#5:.75 E5:.25 D5:1 B4:.5 D5:.5 F#5:.5 A5:.5',
    'B5:1 A5:.5 F#5:.5 D5:1.5 r:.5',
] + HOOK[4:7] + ['F#5:1 E5:.5 C#5:.5 B4:.75 A4:.25 E5:.5 r:.5']
BRIDGE = [
    'r:1 F#4:.5 A4:.5 B4:1 D5:.5 C#5:.5',
    'C#5:1 A#4:.5 F#4:.5 E4:1 r:1',
    'D5:.75 C#5:.25 B4:1 A4:1 F#4:.5 E4:.5',
    'E4:.5 G#4:.5 B4:1 D5:.75 B4:.25 G#4:.5 r:.5',
    'D5:1 B4:.5 A4:.5 G4:1 F#4:.5 r:.5',
    'E4:.5 G4:.5 B4:1 D5:.5 E5:.5 F#5:1',
    'A#4:.5 C#5:.5 E5:.5 F#5:.5 A#5:1 F#5:.5 E5:.5',
    'D#5:.5 F#5:.5 A5:1 F#5:.5 D#5:.5 B4:.5 F#5:.5',
]
FINAL_TAG = [
    'C#6:1 B5:.5 G#5:.5 E5:.75 F#5:.25 G#5:.5 B5:.5',
    'C6:1 A5:.5 F#5:.5 E5:1 F#5:.5 A5:.5',
    'G#5:.5 B5:.5 E6:1.5 D#6:.5 B5:.5 G#5:.5',
    'F#5:.5 A5:.5 B5:1 D#6:.75 B5:.25 F#5:.5 D#5:.5',
]
CODA = [
    'E6:1.5 B5:.5 G#5:1 F#5:.5 E5:.5',
    'D#5:1 F#5:.5 B5:.5 A5:1 F#5:.5 r:.5',
    'G#5:.75 F#5:.25 E5:1 C#5:1 r:1',
    'E5:1 C#5:.5 B4:.5 A4:1 r:1',
    'C5:1 B4:.5 A4:.5 F#4:1 r:1',
    'G#4:.75 F#4:.25 E4:1 B4:.5 G#4:.5 F#4:.5 E4:.5',
    'F#4:1 E4:.5 D#4:.5 F#4:1 B4:.5 D#5:.5',
    'E5:4',
]

MELODIES = [line(s) for s in INTRO + VERSE + ASCENT + HOOK + INTERLUDE
            + VERSE2 + ASCENT2 + REPRISE + BRIDGE]
# Exact motif identity survives the lift; harmony, voicing and orchestration
# supply a larger register and a new emotional context.
MELODIES += [[(t,d,m+2) for t,d,m in line(s)] for s in HOOK]
MELODIES += [line(s) for s in FINAL_TAG + CODA]
assert len(HARMONY) == len(MELODIES) == 92

BAR_BPM = [100]*84 + [96,96,92,88,84,80,74,60]
BAR_TIME = [0.0]
for tempo in BAR_BPM:
    BAR_TIME.append(BAR_TIME[-1] + 240/tempo)

def seconds(bar, beat=0):
    return BAR_TIME[bar] + beat * 60/BAR_BPM[bar]

def add_note(t, d, midi, vel, hand, finger, role='melody'):
    notes.append({'id':f'p{len(notes)+1:05d}', 'time':round(max(0,t),5),
                  'duration':round(d,5), 'midi':midi,
                  'velocity':round(max(.12,min(.98,vel)),4),
                  'hand':hand, 'finger':finger, 'role':role})

def add_acc(instrument, t, d, midi, vel):
    accompaniment.append({'id':f'a{len(accompaniment)+1:05d}',
                          'instrument':instrument, 'time':round(t,5),
                          'duration':round(d,5), 'midi':midi,
                          'velocity':round(vel,4)})

notes, pedals, accents, accompaniment, sections = [], [], [], [], []
section_for_bar = {}
bar = 0
for name, length, style, energy in FORM:
    sections.append({'name':name,'start':round(BAR_TIME[bar],5),
                     'end':round(BAR_TIME[bar+length],5),'energy':energy,
                     'kind':style, 'firstBar':bar+1,'bars':length})
    for j in range(length):
        section_for_bar[bar+j] = (style,energy,j,length)
    bar += length

def support_voicing(melody, pcs, count):
    """Three-note RH grips at most an octave wide, tune always on top."""
    options = [m for m in range(max(60,melody-12),melody-2) if m%12 in pcs]
    # Avoid seconds inside the grip, and favor clear 3rds / 6ths under the tune.
    result=[]
    for target in ([melody-9,melody-5,melody-3] if count==3
                   else [melody-8,melody-4]):
        valid = [m for m in options if all(abs(m-v)>=3 for v in result)]
        if not valid or len(result)>=count: break
        m=min(valid,key=lambda x:(abs(x-target),x))
        result.append(m)
        options.remove(m)
    return sorted(result)

def melodic_fingers(events):
    """Use comfortable local positions; wide phrase shifts happen at releases."""
    unique=sorted(set(m for _,_,m in events))
    if len(unique)<=5:
        scale={1:[3],2:[2,4],3:[1,3,5],4:[1,2,3,5],5:[1,2,3,4,5]}[len(unique)]
        return {m:f for m,f in zip(unique,scale)}
    # More than five tones: upper and lower tetrachords, with a thumb crossing.
    pivot=unique[len(unique)//2]
    return {m:([1,2,3,4,5][min(4,i)] if m<=pivot
               else [2,3,4,5][min(3,i-unique.index(pivot)-1)])
            for i,m in enumerate(unique)}

def left_attacks(style, j, bass, shell):
    octv=[bass,bass+12]
    fifth=[bass,bass+7]
    if style=='intro':
        return [(0,[bass],1.0,.0),(1.5,shell[:2],.72,-.04),(3,[bass+12],.62,-.07)] if j%2==0 else [(0,octv,1.4,0),(2,shell,.95,-.04)]
    if style in ('verse','verse2'):
        if j%4==3:
            return [(0,octv,.7,0),(1.5,shell,.75,-.03),(3,shell[-2:],.6,-.08)]
        if j%2:
            return [(0,[bass],1.15,0),(1,shell,.72,-.04),(2.5,fifth,.6,-.02)]
        return [(0,octv,.7,0),(1.5,shell,.65,-.03),(3,[bass+12],.6,-.07)]
    if style in ('ascent','ascent2'):
        return [(0,octv,.62,0),(1,shell,.55,-.02),(2,fifth,.62,.02),(3,shell,.53,-.015)]
    if style in ('chorus','reprise','final'):
        if j%4==3:
            return [(0,octv,.85,.02),(1.5,shell,.58,-.015),(2.5,fifth,.6,0),(3.5,shell,.33,-.04)]
        if j%4==2:
            return [(0,octv,.65,.03),(1,shell,.48,-.03),(2,octv,.65,.01),(3,shell,.48,-.02)]
        return [(0,octv,.65,.035),(1.5,shell,.55,-.01),(2.5,fifth,.56,.005),(3.5,shell,.30,-.04)]
    if style=='interlude':
        return [(0,[bass],1.25,-.02),(1.5,shell,.9,-.065),(3,[bass+12],.65,-.08)]
    if style=='bridge':
        if j<4: return [(0,[bass,bass+12],1.7,-.015),(2,shell,1.4,-.05)]
        if j<6: return [(0,octv,1.0,0),(1.5,shell,.8,-.02),(3,shell,.6,-.02)]
        return [(0,octv,.65,.05),(1,shell,.55,.01),(2,fifth,.6,.04),(3,shell,.6,.02)]
    if style=='coda':
        if j==7: return [(0,[40,47,52],3.86,-.055)]
        if j>=4: return [(0,[bass],1.6,-.04),(2,shell,1.25,-.09)]
        return [(0,octv,1.0,-.01),(2,shell,1.25,-.065)]
    raise ValueError(style)

for bar, (chord_name, melody_events) in enumerate(zip(HARMONY,MELODIES)):
    style, energy, j, length = section_for_bar[bar]
    bass, pcs, shell = CHORDS[chord_name]
    beat_sec = 60/BAR_BPM[bar]
    phrase = [0,.012,.017,-.004][j%4]  # explicit phrase arch, never noise
    # The reprise's first sentence is restrained. The bridge rebuilds itself.
    dynamic = .48 + energy*.34
    if style=='bridge': dynamic=.50 + .047*j
    if style=='reprise' and j<4: dynamic-=.075
    if style=='final': dynamic+=.02 if j<12 else .055
    if style=='coda': dynamic=.77-.045*j
    fingers=melodic_fingers(melody_events)
    for k,(beat,dur,midi) in enumerate(melody_events):
        onset = seconds(bar,beat) + (.012 if style in ('chorus','final','reprise') else .018) + phrase
        # Off-beat notes speak a touch later, phrase-end notes relax.
        onset += .008 if beat%1==.5 else 0
        if k==len(melody_events)-1 and dur>=1: onset+=.012
        target = seconds(bar,beat+dur)
        physical = max(.065,target-onset - (.055 if k==len(melody_events)-1 else .025))
        if dur<=.25: physical=max(.06,physical-.01)
        contour = .018*(midi-74)/6
        accent = .027 if beat in (0,2) else (-.025 if dur<=.25 else 0)
        velocity=dynamic+contour+accent
        if k==len(melody_events)-1 and dur>=1: velocity-=.04
        # Quiet material is largely a single singing voice. Chorus grips occur
        # at selected melody attacks; sustained inner voices never steal fingers.
        supported = ((style in ('chorus','reprise','final') and (beat in (0,2) or dur>=1.5))
                     or (style in ('ascent','ascent2') and beat==0)
                     or (style=='bridge' and j>=6 and beat==0)
                     or (style=='coda' and j==0 and beat==0))
        if style=='coda' and j==7:
            # Root and fifth sit in LH; F#, G#, C# voice the tonic 6/9.
            backing=[66,68,73]
        else:
            backing=support_voicing(midi,pcs,3 if style=='final' else 2) if supported else []
        # Melody occupies the outside finger in a multi-note grip. Rolled chord
        # keys release before the next attack, with tune sustained above them.
        if backing:
            total=len(backing)+1
            grip={2:[1,5],3:[1,3,5],4:[1,2,3,5]}[total]
            if style=='coda' and j==7: grip=[1,2,4,5]
            for idx,p in enumerate(backing):
                add_note(onset-.012+.004*idx, min(physical,.87*beat_sec*dur),p,
                         velocity-.16-.014*(len(backing)-idx), 'R',grip[idx],'harmony')
            finger=grip[-1]
        else: finger=fingers[midi]
        add_note(onset,physical,midi,velocity,'R',finger,'melody')

    attacks=left_attacks(style,j,bass,shell)
    for idx,(beat,keys,hold,vdelta) in enumerate(attacks):
        keys=sorted(keys)
        # Low octaves lead the beat very slightly in the largest passages.
        t=seconds(bar,beat)+(-.008 if style in ('chorus','reprise','final') and beat==0 else .004)
        t=max(0,t)
        next_beat=attacks[idx+1][0] if idx+1<len(attacks) else 4
        max_end=seconds(bar,next_beat)-.044
        basevel=(.36+energy*.29)+vdelta
        if style=='bridge': basevel=.36+j*.036+vdelta
        if style=='coda': basevel=.57-j*.025+vdelta
        assignment={1:[3],2:[5,1],3:[5,3,1]}[len(keys)]
        for a,p in enumerate(keys):
            start=t+.006*a
            d=max(.065,min(hold*beat_sec,max_end-start))
            add_note(start,d,p,basevel-(.025*a),'L',assignment[a],'bass' if a==0 else 'harmony')

    # Pedal belongs to the performer, not to key-release timestamps. Clear each
    # new bass/harmony before catching it; intense passages get a mid-bar breath.
    if bar:
        pedals.append({'time':round(seconds(bar)-.027,5),'value':0})
    pedals.append({'time':round(seconds(bar)+.055,5),'value':.88 if style in ('intro','coda','bridge') else .72})
    if style in ('chorus','final','reprise') and j%4==2:
        pedals += [{'time':round(seconds(bar,1.96),5),'value':0},
                   {'time':round(seconds(bar,2.055),5),'value':.72}]
    accents.append({'time':round(seconds(bar),5),'energy':round(energy*(1.0 if j%4==0 else .55),3)})

    # Optional orchestration is kept out of visible pianist events. String
    # voicings lead smoothly; the bridge deliberately withdraws the ensemble.
    orchestral=(style in ('ascent','chorus','ascent2','reprise','final') or
                (style=='verse2' and j>=4) or (style=='bridge' and j>=6) or
                (style=='coda' and j<3))
    if orchestral:
        string_pitches=[p for p in range(55,78) if p%12 in pcs]
        chosen=[]
        for target in (57,64,71,76):
            options=[p for p in string_pitches if p not in chosen and all(abs(p-x)>=3 for x in chosen)]
            if options: chosen.append(min(options,key=lambda p:abs(p-target)))
        sv=.16+energy*.17
        if style=='coda': sv=.20-j*.035
        string_hold=4*beat_sec-.10
        if style=='reprise' and j==length-1:
            string_hold=2.45*beat_sec  # the ensemble inhales before the bridge
        elif style=='chorus' and j==length-1:
            string_hold=2.85*beat_sec
        elif j%4==3:
            string_hold=3.62*beat_sec
        for p in chosen:
            add_acc('strings',seconds(bar)+.042,string_hold,p,sv)
        if style not in ('coda','verse2'):
            add_acc('bass',seconds(bar),1.85*beat_sec,bass,.33+energy*.18)
            if style in ('chorus','reprise','final') and not (style=='reprise' and j==length-1):
                add_acc('bass',seconds(bar,2.5),1.35*beat_sec,bass,.27+energy*.16)
    rhythmic=(style in ('chorus','reprise','final') or (style in ('ascent','ascent2') and j>=length-4))
    if rhythmic:
        # Four deliberately distinct bars: statement, displacement, propulsion,
        # turnaround. These are phrases rather than an unaccented drum machine.
        drum_phrase = [
            ([(0,1),(2.5,.78)],[(1,.83),(3,.94)],[(0,.90),(.5,.44),(1.5,.58),(2,.80),(2.5,.47),(3.5,.61)]),
            ([(0,.84),(2.75,.73)],[(1,.78),(3,.86)],[(0,.77),(1,.51),(1.5,.41),(2,.72),(3.5,.57)]),
            ([(0,1),(1.75,.45),(2.5,.86)],[(1,.91),(3,1)],[(0,1),(.5,.43),(1,.56),(1.5,.45),(2,.92),(2.5,.48),(3,.53),(3.5,.67)]),
            ([(0,.89),(2,.67)],[(1,.82),(3,.72),(3.5,.22),(3.75,.31)],[(0,.84),(.5,.47),(1.5,.54),(2,.78),(2.5,.41)]),
        ][j%4]
        kick, snare, hats = drum_phrase
        if style in ('ascent','ascent2'):
            kick=[(0,.80),(2.5,.58)]
            hats=[(0,.72),(1.5,.43),(2,.65),(3.5,.49)]
        if style in ('chorus','reprise') and j==length-1:
            # No late fill across a deliberate emotional withdrawal.
            kick=[(0,.82)]
            snare=[(1,.68)]
            hats=[(0,.69),(.5,.39),(1.5,.42)]
        if style=='final' and j>=12:
            # The extension broadens into half time beneath the larger tune.
            kick=[(0,1),(2.5,.68)]
            snare=[(2,.87)]
            hats=[(0,.8),(1,.45),(2,.7),(3,.43)]
        for beat,strength in kick:
            add_acc('kick',seconds(bar,beat),.18,36,(.29+energy*.14)*strength)
        for beat,strength in snare:
            add_acc('snare',seconds(bar,beat)+.012,.16,38,(.16+energy*.14)*strength)
        for beat,strength in hats:
            add_acc('hihat',seconds(bar,beat)+(.008 if beat%1 else .003),.055,42,.155*strength)
        if style=='final' and j in (0,8,12):
            add_acc('cymbal',seconds(bar),1.7,49,.22)

# Hold the completed final tonic under the pedal, then release into a real tail.
pedals.append({'time':round(BAR_TIME[-1]+1.15,5),'value':0})
duration=round(BAR_TIME[-1]+4.0,5)
sections[-1]['end']=duration
notes.sort(key=lambda n:(n['time'],n['midi']))
pedals.sort(key=lambda e:e['time'])
accompaniment.sort(key=lambda n:(n['time'],n['midi']))

score = {
    'title':'DAYBREAK', 'composer':'Original composition for this experience',
    'bpm':BPM, 'duration':duration, 'meter':[4,4], 'key':'D major → E major',
    'sections':sections,'notes':notes,'pedals':pedals,'accents':accents,
    'accompaniment':accompaniment,
    'tempoMap':[{'time':round(BAR_TIME[b],5),'bpm':BAR_BPM[b]}
                for b in range(92) if b==0 or BAR_BPM[b]!=BAR_BPM[b-1]],
    'harmony':[{'bar':b+1,'time':round(BAR_TIME[b],5),'duration':round(BAR_TIME[b+1]-BAR_TIME[b],5),'chord':name}
               for b,name in enumerate(HARMONY)],
    'performance':{
        'noteDurations':'Physical key holds; use independent pedal events for sustained sound.',
        'timing':'Deterministic phrase rubato, slightly leading bass, singing melody behind the pulse.',
        'pianoPriority':'Melody 8–12 dB above orchestral accompaniment; drums remain soft.',
        'tail':'Final tonic held through 1.15 seconds beyond the last measure; pedal releases before the final tail.',
    },
}

def validate(data):
    failures=[]
    ns=data['notes']
    ids=[n['id'] for n in ns]
    if len(ids)!=len(set(ids)): failures.append('Duplicate piano ID')
    if not 180<=data['duration']<=240: failures.append('Duration outside 3–4 minutes')
    for n in ns:
        if not 33<=n['midi']<=90: failures.append(f"Pitch range: {n['id']}")
        if not 0<n['velocity']<=1: failures.append(f"Velocity: {n['id']}")
        if n['duration']<=0 or n['time']<0 or n['time']+n['duration']>data['duration']:
            failures.append(f"Timing bounds: {n['id']}")
        if n['hand'] not in ('L','R') or n['finger'] not in range(1,6): failures.append(f"Hand/finger: {n['id']}")
    # Sweep exact physical holds. End precedes start at equal timestamps.
    events=[]
    for n in ns:
        events += [(n['time'],1,n),(round(n['time']+n['duration'],6),0,n)]
    events.sort(key=lambda e:(e[0],e[1]))
    active={}
    max_poly={'L':0,'R':0}
    max_span={'L':0,'R':0}
    for t,typ,n in events:
        if not typ:
            active.pop(n['id'],None)
            continue
        active[n['id']]=n
        by_pitch=Counter(a['midi'] for a in active.values())
        for midi,count in by_pitch.items():
            if count>1: failures.append(f'Duplicate physical key {midi} at {t:.5f}')
        for hand in ('L','R'):
            held=[a for a in active.values() if a['hand']==hand]
            max_poly[hand]=max(max_poly[hand],len(held))
            span=max((a['midi'] for a in held),default=0)-min((a['midi'] for a in held),default=0)
            max_span[hand]=max(max_span[hand],span)
            if len(held)>5: failures.append(f'{hand} polyphony {len(held)} at {t:.5f}')
            if span>(16 if hand=='L' else 14): failures.append(f'{hand} hand span {span} at {t:.5f}')
            fingers=Counter(a['finger'] for a in held)
            if any(v>1 for v in fingers.values()): failures.append(f'{hand} same-finger overlap at {t:.5f}')
            # Ascending pitches must correspond to ascending RH fingers and
            # descending LH fingers when a whole grip is down.
            ordered=sorted(held,key=lambda a:a['midi'])
            fs=[a['finger'] for a in ordered]
            if fs!=sorted(fs,reverse=hand=='L'): failures.append(f'{hand} crossed-finger grip at {t:.5f}')
    for prev,nxt in zip(data['sections'],data['sections'][1:]):
        if abs(prev['end']-nxt['start'])>.001: failures.append('Section gap/overlap')
    if data['pedals'][-1]['value']!=0: failures.append('Pedal not released at end')
    if len(HARMONY)!=sum(s['bars'] for s in data['sections']): failures.append('Form length mismatch')
    last=max(ns,key=lambda n:n['time']+n['duration'])
    result={'passed':not failures,'duration':data['duration'],'pianoNotes':len(ns),
            'accompanimentEvents':len(data['accompaniment']),'bars':len(HARMONY),
            'uniqueHarmonies':len(set(HARMONY)), 'pitchRange':[min(n['midi'] for n in ns),max(n['midi'] for n in ns)],
            'maxPhysicalPolyphony':max_poly,'maxPhysicalSpanSemitones':max_span,
            'lastKeyRelease':round(last['time']+last['duration'],5),
            'lastPedalRelease':data['pedals'][-1]['time'],
            'errors':sorted(set(failures))}
    return result

report=validate(score)
(OUT/'score.json').write_text(json.dumps(score,separators=(',',':'))+'\n')
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
status='PASS' if report['passed'] else 'FAIL'
(OUT/'VALIDATION.md').write_text(
    f'# DAYBREAK validation — {status}\n\n'
    +f"- Runtime: {duration:.2f} seconds ({int(duration//60)}:{duration%60:05.2f}).\n"
    +f"- Form: {len(HARMONY)} authored measures; {len(sections)} sections; {report['uniqueHarmonies']} harmonic spellings.\n"
    +f"- Piano: {len(notes)} note events, MIDI {report['pitchRange'][0]}–{report['pitchRange'][1]}.\n"
    +f"- Maximum physical polyphony: left {report['maxPhysicalPolyphony']['L']}; right {report['maxPhysicalPolyphony']['R']}.\n"
    +f"- Maximum simultaneous span: left {report['maxPhysicalSpanSemitones']['L']} semitones; right {report['maxPhysicalSpanSemitones']['R']} semitones.\n"
    +'- Same-finger overlap, key collision, crossed grip, event bounds, ID uniqueness, pedal release, and section continuity checked by exact event sweep.\n'
    +f"- Last physical release: {report['lastKeyRelease']:.2f}s. Last pedal release: {report['lastPedalRelease']:.2f}s.\n"
    +f"- Optional orchestration: {len(accompaniment)} separately identified events.\n\n"
    +'## Remaining scope\n\nThis validates the score and keyboard mechanics. Audibility, sample loading, envelope behavior, pedal rendering and final balance must also be checked in the playback engine. Fingering is an animation-ready plausible performance, not a claim that every pianist would choose the same fingering.\n\n'
    +'## Errors\n\n'+ ('None.\n' if report['passed'] else '\n'.join('- '+e for e in report['errors'])+'\n'))
print(json.dumps(report,indent=2))
if not report['passed']: raise SystemExit(1)
