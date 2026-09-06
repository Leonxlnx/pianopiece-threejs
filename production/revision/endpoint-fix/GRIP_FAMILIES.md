# Corrected grip-family coverage — score 8d92

Same hand, assigned finger, black/white contact class, contact lift, active grip, wrist rotation and key-relative wrist position at settled attack. Quantized to10 micrometers /1e-5 quaternion component. This groups settled contact poses, not complete neighboring motion or idle fingers; worst held state remains measured independently.

42 corrected endpoint/neighbor notes reduce to21 settled-contact families. Whole neighboring movement and idle fingers are not assumed equivalent. Each row reports its actual worst held metrics measured at1kHz; the times remain strictly inside the physical hold. Existing renders can cover a settled grip, while an additional late-hold frame may be needed where the wrist moves.

| Family | Hand/finger | Notes | Worst spread | Lowest rest-forward |
|---|---|---|---|---|
| F01 | L1 | p00775, p00414 | 29.9° at 88.037590s (p00414) | 0.764 at 167.750740s (p00775) |
| F02 | L5 | p00784, p00422 | 43.1° at 89.690355s (p00422) | 0.583 at 89.690355s (p00422) |
| F03 | R4 | p00982 | 55.1° at 199.632362s (p00982) | 0.428 at 199.632362s (p00982) |
| F04 | L1 | p00795, p00938, p00432, p00527 | 17.9° at 192.331833s (p00938) | 0.926 at 192.331833s (p00938) |
| F05 | R3 | p00475 | 46.1° at 98.672353s (p00475) | 0.167 at 98.672353s (p00475) |
| F06 | L1 | p00489, p00394, p00893, p00753, p00857, p00364, p00720, p00458 | 27.3° at 96.217580s (p00458) | 0.763 at 101.675382s (p00489) |
| F07 | R3 | p00842 | 46.1° at 177.884729s (p00842) | 0.173 at 177.884729s (p00842) |
| F08 | L2 | p00919, p00927 | 60.4° at 189.512201s (p00919) | 0.177 at 189.512201s (p00919) |
| F09 | L2 | p00604 | 38.6° at 130.607962s (p00604) | 0.364 at 130.607962s (p00604) |
| F10 | R2 | p00978 | 52.6° at 198.673195s (p00978) | 0.331 at 198.673195s (p00978) |
| F11 | L4 | p00777, p00416 | 48.0° at 168.084567s (p00777) | 0.127 at 168.084567s (p00777) |
| F12 | L1 | p00786, p00424 | 21.6° at 169.795878s (p00786) | 0.850 at 169.795878s (p00786) |
| F13 | L1 | p00955 | 16.5° at 194.970173s (p00955) | 0.816 at 194.970173s (p00955) |
| F14 | L4 | p00953 | 50.3° at 194.614503s (p00953) | 0.639 at 194.614503s (p00953) |
| F15 | R2 | p00858 | 57.4° at 180.944849s (p00858) | 0.281 at 180.944849s (p00858) |
| F16 | L1 | p00983, p00715, p00708 | 1.1° at 156.896624s (p00708) | 0.981 at 156.575624s (p00708) |
| F17 | L1 | p00411, p00772 | 21.7° at 167.130412s (p00772) | 0.910 at 167.403412s (p00772) |
| F18 | L4 | p00430, p00525 | 37.9° at 107.472693s (p00525) | 0.644 at 90.849087s (p00430) |
| F19 | L4 | p00793, p00936 | 37.9° at 191.906499s (p00936) | 0.644 at 170.230866s (p00793) |
| F20 | L3 | p00918, p00925 | 54.2° at 190.627683s (p00925) | 0.165 at 190.633683s (p00925) |
| F21 | R1 | p00528 | 3.3° at 107.601602s (p00528) | 0.981 at 107.601602s (p00528) |

Existing focused-render coverage: F01/F02 have new oblique images in `../collision-review/render-forward-L`; exact held midpoint views are being reviewed independently. F04 has the cleaner thumb grip at170.7807 in `render-endpoint-L/gl-960-1.jpg`. F06 has accepted octave frames at186.0/101.6/159.3 in `../endpoint-review/render-three`. F15 has the180.7s RH frame in `render-endpoint-R/gl-960-0.jpg`. F21 has a corrected post-release frame in `render-forward-R`, with an exact held midpoint107.8254105 being checked independently. Those existing views are not automatically worst-state coverage.

No score changes were made to build this mapping. `grip-family-views.json` is the finite candidate frame list; root can prune already-covered equivalent states.
