# Exact composer revision for bars 36 and 80

The complete voiced pitch-class collection in either bar is F,A,C,D,E. There is no G ninth in these bars. F2 establishes the harmonic root; the melody descends F5–E5–D5–C5. The late beat2.5 A2/C3 dyad becomes A2/E3 while C5 is still held, so the held A–C–E sonority supplies a late Fmaj7/A color over the established/pedaled F bass. E was already heard in the melody; the edit strengthens that major-seventh color in the accompaniment. D is a passing13th. Fmaj7 is a suitable bar-level metadata label; Fmaj9/A would imply an absent G and would overstate A as the bass for the whole bar.

Only the second upper accompaniment grip in each bar changes. The earlier A2/C3 grip at beat1, F2 downbeat, lead melody, timing, durations, velocity, pedal and all other bars stay exact. No global H['Fadd9'] or FORM substitution is appropriate.

The proposed insertion is reproduction/compose-late-voicing.patch. It sits after deterministic performance/fingering and ID assignment, before score serialization. It matches musical coordinates(bar36/80, LH harmony, beat2.5, C3), changes only pitch to E3, asserts the two expected IDs, and relabels only those two harmony rows Fmaj7.

I executed both placements in isolated copied generators. Adding the pitch override before fingering preserves audible timing but also changes seed finger fields on db406/db407/db922/db923. The recommended after-performance insertion changes exactly two midi fields plus two chord labels, with every other generated-event field byte-for-value identical. The full comparison is reproduction/COMPARISON.json; baseline and both generated seed scores are preserved there. The production seed has1011 notes and227.101587 seconds in every variant.

The runtime patch is approved-voicing-delta.json and score-approved-voicing.json. The metadata labels cannot affect the already-measured hand geometry. No alternate-finger candidate or experimental thumb source is included. The new master audio must be rendered from the final coherent runtime score.
