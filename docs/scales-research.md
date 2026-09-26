# Scale Library Research: Formulas, Dromoi and 12-TET Caveats

*Research for the scale library at `/klimakes/{instrument}/{root}-{scale}`. Checked 2026-09-26 against `tonal` 6.4.2 (`@tonaljs/scale-type` 4.9.1), which is installed in `app/node_modules`.*

## Summary

- **Western scales.** All of them (major, the three minors, the 7 church modes, both pentatonics, both blues scales) have an exact `tonal` match. They are 12-TET by definition, so they can be published as-is.
  - Melodic minor needs one note. `tonal`'s `melodic minor` is only the ascending (jazz) form. The classical form falls back to natural minor on the way down, and `tonal` does not model scales that differ by direction.
- **Dromoi that are safe in 12-TET.** Χιτζάζ, Χιτζαζκιάρ, Νιαβέντ, Νικρίζ, Ουσάκ, Ραστ/Ματζόρε and Μινόρε are fine, with a caveat line.
  - Rebetiko has been played on fretted, equal-tempered bouzouki since the early 1930s. Delegos (2021) calls the result "equal tempered makam", and describes interwar bouzouki rebetiko as "exclusively related to twelve-tone equal temperament" ([Delegos 2021, p. 333](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)).
  - The Hicaz-family tetrachords (Χιτζάζ, Χιτζαζκιάρ, Νιαβέντ, Νικρίζ, Πειραιώτικος) are mostly semitones and augmented seconds, so they survive 12-TET well.
- **Where Greek names differ from Turkish makam names.** This is the biggest correctness risk. Greek musicians kept the Ottoman names but often attach them to different scales ([Ordoulidis 2011, pp. 2–4](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)):
  - Greek **Ουσάκ** is Turkish **Kürdî** (plain phrygian).
  - Greek **Κιουρντί** is "something completely different" from Turkish Kürdî. Greek teaching sources give it the Καρσιγάρ shape.
  - Greek **Νιαβέντ** is Turkish **Neveser**, not Nihavend.
  - Pages must describe the **Greek usage** and not claim to be the Turkish makam.
- **Low confidence: Χουζάμ, Σεγκιάχ, Σαμπάχ.** These come from makams whose tonic or 2nd degree is a neutral pitch (segâh), which 12-TET cannot play.
  - Greek sources give fixed equal-tempered forms, but they disagree with each other and with the Turkish originals.
  - Σαμπάχ's octave is not a clean octave (it tops out on Db over a D tonic).
  - Publish them only with explicit caveat text. Σεγκιάχ and Χουζάμ could also be held back from v1.
- **Harmony caveat for every dromos.** Rebetiko harmony per dromos is a small set of conventional chords. Pennanen calls it "traditional" harmonization, and it is not built by stacking thirds on each degree ([Delegos 2021, p. 335](https://ejournals.lib.auth.gr/smb/article/download/7945/7801); [Ordoulidis 2011, pp. 9–12](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)). A diatonic-triads table on a dromos page is fine as a theory aid, but it should not claim to show "the chords of the dromos".
- **Tonic.** Greek bouzouki players describe every dromos on **D (Ρε)**, because the 3-course bouzouki is tuned D-A-D ([Ordoulidis 2011, p. 12](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)). D is the right default root for dromoi pages.

Notation used below: formulas are in scale degrees relative to the tonic. Steps are W = τόνος (2 semitones), H = ημιτόνιο (1), 1½ = τριημιτόνιο (3). Greek sources write these as Τ, Η, and ΤΡ or 3Η. "Chroma" is `tonal`'s 12-character pitch-class bitmask, starting from C = tonic.

## Summary table

| Scale | Greek name | Formula (12-TET) | Steps | tonal name | Confidence | Recommendation |
|---|---|---|---|---|---|---|
| Ousak | Ουσάκ | 1 b2 b3 4 5 b6 b7 | H W W W H W W | `phrygian` | High (as Greek usage) | Publish with caveat |
| Kiourdi (Greek usage) | Κιουρντί / Γκιουρντί | 1 2 b3 4 b5 6 b7 (asc) | W H W H 1½ H W | none (chroma `101101100110`) | Low–medium | Publish with caveat, or hold back |
| Hijaz | Χιτζάζ | 1 b2 3 4 5 b6 b7 | H 1½ H W H W W | `phrygian dominant` | High | Publish with caveat |
| Hijazkar | Χιτζαζκιάρ | 1 b2 3 4 5 b6 7 | H 1½ H W H 1½ H | `double harmonic major` | High | Publish with caveat |
| Rast | Ραστ | asc 1 2 3 4 5 6 7 / desc b7 | W W H W W W H | `major` (desc = `mixolydian`) | Medium | Publish with caveat (neutral 3rd/7th) |
| Saba | Σαμπάχ | 1 2 b3 b4 5 b6 b7 (+ b8 above) | W H H 1½ H W W | none (chroma `101110011010`) | Medium-low | Publish with strong caveat |
| Niavent (≈ Neveser) | Νιαβέντ | 1 2 b3 #4 5 b6 7 | W H 1½ H H 1½ H | `hungarian minor` | High | Publish with caveat |
| Nikriz | Νικρίζ | 1 2 b3 #4 5 6 b7 | W H 1½ H W H W | `dorian #4` | High | Publish with caveat |
| Houzam (Greek form) | Χουζάμ | 1 #2 3 4 5 b6 7 | 1½ H H W H 1½ H | exact chroma = `augmented heptatonic` (do not use that name) | Low | Strong caveat, or hold back |
| Peiraiotikos | Πειραιώτικος | 1 b2 3 #4 5 b6 b7 (var. 7) | H 1½ W H H W W | none (the variant with 7 = `double harmonic lydian`) | Medium-low | Publish with caveat, mention the variant |
| Karsigar | Καρσιγάρ | 1 2 b3 4 b5 6 b7 | W H W H 1½ H W | none (the b2 variant = `locrian 6`) | Medium | Publish with caveat |
| Segiah (Greek form) | Σεγκιάχ | 1 #2 3 4 5 6 7 (desc b7) | 1½ H H W W W H | none (chroma `100111010101`) | Low | Strong caveat, or hold back |
| Matzore | Ματζόρε | = major | W W H W W W H | `major` | High | Publish as alias of major |
| Minore | Μινόρε | natural or harmonic minor | see those rows | `minor` / `harmonic minor` | High (with the naming note) | Umbrella term; don't publish as a single scale |
| Major | Μείζονα (ματζόρε) | 1 2 3 4 5 6 7 | W W H W W W H | `major` / `ionian` | High | Publish as-is |
| Natural minor | Φυσική ελάσσονα | 1 2 b3 4 5 b6 b7 | W H W W H W W | `minor` / `aeolian` | High | Publish as-is |
| Harmonic minor | Αρμονική ελάσσονα | 1 2 b3 4 5 b6 7 | W H W W H 1½ H | `harmonic minor` | High | Publish as-is |
| Melodic minor | Μελωδική ελάσσονα | asc 1 2 b3 4 5 6 7 | W H W W W W H | `melodic minor` (asc/jazz only) | High | Publish with note on descending form |
| Ionian | Ιωνικός | = major | W W H W W W H | `ionian` | High | Publish as-is |
| Dorian | Δώριος | 1 2 b3 4 5 6 b7 | W H W W W H W | `dorian` | High | Publish as-is |
| Phrygian | Φρύγιος | 1 b2 b3 4 5 b6 b7 | H W W W H W W | `phrygian` | High | Publish as-is |
| Lydian | Λύδιος | 1 2 3 #4 5 6 7 | W W W H W W H | `lydian` | High | Publish as-is |
| Mixolydian | Μιξολύδιος | 1 2 3 4 5 6 b7 | W W H W W H W | `mixolydian` | High | Publish as-is |
| Aeolian | Αιολικός | = natural minor | W H W W H W W | `aeolian` | High | Publish as-is |
| Locrian | Λόκριος | 1 b2 b3 4 b5 b6 b7 | H W W H W W W | `locrian` | High | Publish as-is |
| Major pentatonic | Μείζονα πεντατονική | 1 2 3 5 6 | W W 1½ W 1½ | `major pentatonic` | High | Publish (no triad table) |
| Minor pentatonic | Ελάσσονα πεντατονική | 1 b3 4 5 b7 | 1½ W W 1½ W | `minor pentatonic` | High | Publish (no triad table) |
| Blues (minor, conventional) | Κλίμακα μπλουζ | 1 b3 4 b5 5 b7 | 1½ W H H 1½ W | `minor blues` (alias `blues`) | High | Publish as-is |
| Major blues | Μείζονα μπλουζ | 1 2 b3 3 5 6 | W H H 1½ W 1½ | `major blues` | High | Publish as-is |

## Greek dromoi

**Common background for every dromos.** Ordoulidis ([2011](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)) makes three points that apply to all of them:

- Greek musicians teach dromoi as 8-note scales (octachords), while makam theory is built on tetrachords and pentachords (p. 7).
- Existing Greek method books (Paghiátis 1987/1992, Nikolópoulos n.d.) "lack in-depth research and academic methodology" and contain "many mistakes with regards to the names and the structure of the dhrómi" (p. 2).
- Using makam theory on the bouzouki part is "problematic", because the bouzouki has only tones and semitones (p. 3).

Delegos adds that the defining feature that survives equal temperament is the *seyir*, the melodic behaviour, "beyond the existence or not of microintervals" ([2021, p. 334](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)).

The Turkish makam data below comes from İ. H. Özkan's entries in the *TDV İslâm Ansiklopedisi*. Arel-Ezgi-Uzdilek (AEU) interval sizes: 1 comma ≈ 23 c, bakiye 4 commas ≈ 91 c, küçük mücenneb 5 ≈ 113 c, büyük mücenneb 8 ≈ 181 c, tanini 9 ≈ 204 c, artık ikili 12–13 ≈ 272–295 c ([Wikipedia: Turkish makam](https://en.wikipedia.org/wiki/Turkish_makam)).

### Ουσάκ (Ousák)
1. **Formula:** 1 b2 b3 4 5 b6 b7, steps H W W W H W W. On D: Ρε Μι♭ Φα Σολ Λα Σι♭ Ντο ([Katsikias, Greek school network](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)). One Greek article describes it as "the key signature of the major scale a major third below", i.e. B♭ major from D ([musicheaven.gr](https://www.musicheaven.gr/modules.php?name=News&file=article&id=473)).
2. **Tonic:** D. **Structure:** Ουσάκ tetrachord (D Eb F G) plus a minor pentachord (Katsikias). **Direction:** Ordoulidis records two idioms ([p. 7](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)):
   - the 2nd degree "sometimes sounds flat and sometimes natural, depending on whether the melody is ascending or descending";
   - the 6th gravitates up toward the 7th in ascending lines.

   There is also a rast/"matzóre" pentachord idiom *below* the tonic (G A B C D) that is not a modulation (p. 8).
3. **Microtones:** Turkish Uşşak's 2nd (segâh) is a neutral 2nd, about 6–8 commas above the tonic. TDV notes it is lowered 1–2 commas on descent ([TDV Uşşak](https://islamansiklopedisi.org.tr/ussak)). In 12-TET that pitch becomes Eb (usual) or E (sometimes).
4. **Names:** Ουσάκ, Ουσσάκ; Turkish *Uşşâk*. **Naming inversion:** the Greek Ουσάκ scale is Turkish **Kürdî** (Kürdî tetrachord on dügâh plus Bûselik pentachord on nevâ, which is exactly phrygian; [TDV Kürdî](https://islamansiklopedisi.org.tr/kurdi)). Ordoulidis's example: "Το βαπόρι απ' την Περσία" is called ousák by Greek musicians, but by makam theory it is kürdî ([p. 4](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)). Katsikias says the same.
5. **tonal:** `phrygian`.
6. **Confidence:** high for the Greek-usage set. **Recommendation:** publish with caveat. The page should mention the unstable 2nd and should not call it the Turkish Uşşak.

### Κιουρντί (Kiourdí)
1. **Formula (Greek teaching usage):** 1 2 b3 4 b5 6 b7, steps W H W H 1½ H W. On D: Ρε Μι Φα Σολ Λα♭ Σι Ντο. The Greek school page lists it as a single entry, "Γκιουρντί/Καρσιγάρ" ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)). One secondary hobbyist listing (not cited, per project sourcing policy) gives the same ascending form, with a natural-minor descent.
2. **Structure:** "Γκιουρντί" tetrachord (D E F G) plus a Χιτζάζ pentachord on G (G Ab B C D). The ascending and descending forms may differ; this is UNVERIFIED in an academic source.
3. **Disagreement:** Ordoulidis shows that the two main Greek method books (Paghiátis 1992 p. 57 and Nikolópoulos n.d. p. 34) give *different* scales for kiourdí. He also says Greek dhrómos kiourdí "is considered to be something completely different" from maqam kürdî ([pp. 2, 4](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)). I could not read the notated figures from the PDF, so the exact contents of Paghiátis's and Nikolópoulos's versions are UNVERIFIED.
   - The phrygian shape that the brief assumed ("Ουσάκ vs Κιουρντί both ≈ phrygian") is correct only for *Turkish* Kürdî. In Greek usage that shape is Ουσάκ.
   - Some musicians do use "κιουρντί" for plain phrygian with a "true" semitone 2nd. This is UNVERIFIED in a written source.
4. **Names:** Κιουρντί, Γκιουρντί, Κιουρδί; Turkish *Kürdî*.
5. **tonal:** no match. Chroma `101101100110`, pitch classes {0,2,3,5,6,9,10}. It is a rotation of `harmonic major` and of `lydian diminished`.
6. **Confidence:** low–medium. **Recommendation:** publish with caveat, or hold back and link to Καρσιγάρ. Whichever you choose, do not show it as phrygian.

### Χιτζάζ (Hitzáz)
1. **Formula:** 1 b2 3 4 5 b6 b7, steps H 1½ H W H W W. The Greek source writes "Η-ΤΡ-Η-Τ-Η-Τ-Τ", on D: ρε μι♭ φα# σολ λα σι♭ ντο ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)). Musicheaven describes it as the minor key signature a fourth higher, with a raised 3rd ([musicheaven.gr](https://www.musicheaven.gr/modules.php?name=News&file=article&id=473)).
2. **Tonic:** D. Katsikias calls it "the most common dromos in rebetiko". **Structure:** Χιτζάζ tetrachord (D Eb F# G) plus a minor/Ουσάκ-type tetrachord on A (A Bb C D).
   - The same rast pentachord idiom below the tonic (G A B C D) occurs as in Ουσάκ ([Ordoulidis p. 8](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)).
   - Ordoulidis states that "dhrómos hitzáz does correspond to maqam hicâz" (p. 12).
   - **Disagreement with Turkish theory:** Turkish Hicaz is a Hicaz tetrachord on dügâh plus a **Rast pentachord on nevâ**, i.e. natural 6 when ascending: 1 b2 3 4 5 6 b7 ([TDV Hicaz](https://islamansiklopedisi.org.tr/hicaz--musiki)). The Greek dromos normally uses b6.
3. **Microtones:** the Hicaz tetrachord's steps (about 5 + 12/13 + 5 commas, i.e. ~113 + ~272–295 + ~113 c) are close to 100 + 300 + 100 c, so the 12-TET version is close. Katsikias mentions "hard, soft and karip" Χιτζάζ variants; these are UNVERIFIED in detail.
4. **Names:** Χιτζάζ, Χιτζαζ; Turkish *Hicaz*; Arabic *Ḥijāz* / *Hijaz*.
5. **tonal:** `phrygian dominant` (aliases `spanish`, `phrygian major`).
6. **Confidence:** high. **Recommendation:** publish with caveat.

### Χιτζαζκιάρ (Hitzazkiár)
1. **Formula:** 1 b2 3 4 5 b6 7, steps H 1½ H W H 1½ H. On D: Ρε Ρε# Φα# Σολ Λα Λα# Ντο# ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis), who spells it Χιτζασκιάρ). Katsikias notes it is "rarely used on its own; usually combined with Χιτζάζ".
2. **Structure:** Χιτζάζ tetrachord on D plus Χιτζάζ tetrachord on A. The Turkish version: Hicaz pentachord on rast plus Hicaz tetrachord on nevâ, tonic rast ([TDV Hicazkâr](https://islamansiklopedisi.org.tr/hicazkar)). The shape is the same.
3. **Microtones:** minimal, same reasoning as Χιτζάζ.
4. **Names:** Χιτζαζκιάρ, Χιτζασκιάρ; Turkish *Hicazkâr*.
5. **tonal:** `double harmonic major` (alias `gypsy`).
6. **Confidence:** high. **Recommendation:** publish with caveat.

### Ραστ (Rast)
1. **Formula:** ascending 1 2 3 4 5 6 7 (W W H W W W H). Descending: b7 (W W H W W H W). Katsikias gives it on C as the white keys only (major). The descending b7 is the Turkish rule: in descending phrases acem replaces eviç, with a Bûselik tetrachord on nevâ ([TDV Rast](https://islamansiklopedisi.org.tr/rast)).
2. **Structure:** Rast pentachord plus Rast tetrachord on nevâ; tonic rast (G in Turkish notation). Ordoulidis: Greek musicians often use Ραστ as a synonym for Ματζόρε ([n. xxxii](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)). Delegos analyses Tsitsanis pieces "in the key of D major resembling makam Rast" ([p. 346](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)).
3. **Microtones:** in the Turkish makam the 3rd (segâh) and the 7th (eviç) are about a comma lower than equal-tempered major. 12-TET flattens this to major, with a movable 7th. Delegos notes that an E♯ in a D-Rast bouzouki melody marks a "Segah" flavour, meaning the neutral 3rd is suggested by the lower chromatic neighbour.
4. **Names:** Ραστ; Turkish *Rast*; Arabic *Rāst*.
5. **tonal:** `major`. The descending form is `mixolydian`.
6. **Confidence:** medium, because the neutral 3rd and 7th are lost. **Recommendation:** publish with caveat. Show the ascending form and note the b7 on descent.

### Σαμπάχ (Sabáh)
1. **Formula (Greek 12-TET):** 1 2 b3 b4 5 b6 b7, with a **b8 (Db) at the top**. Steps: W H H 1½ H W W, and the upper "octave" is only a half step above b7.
   - On D: ρε μι φα σολ♭ λα σι♭ ντο ντο# ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)), who calls it "the only dromos that starts on Ρε and ends on Ντο#".
   - Musicheaven: minor key signature without a leading tone, lowered 4th, "often the 8th lowered as well" ([musicheaven.gr](https://www.musicheaven.gr/modules.php?name=News&file=article&id=473)).
   - A Greek forum summary gives D E F G♭ A B♭ C D♭ ([rembetiko.gr: Ο δρόμος Σαμπάχ](https://rembetiko.gr/t/%CE%BF-%CE%B4%CF%81%CF%8C%CE%BC%CE%BF%CF%82-%CF%83%CE%B1%CE%BC%CF%80%CE%AC%CF%87/12968)).
2. **Structure:** Σαμπάχ tetrachord (D E F G♭) plus a disjunct Ουσάκ tetrachord (Katsikias). The Turkish version: Saba tetrachord plus a zirgüleli-hicaz tetrachord on çârgâh; tonic dügâh; notes dügâh, segâh, çârgâh, hicaz, dik-hisar, acem, gerdâniye, şehnaz. TDV states explicitly that the upper şehnaz is **not a perfect octave** above the tonic ([TDV Sabâ](https://islamansiklopedisi.org.tr/saba)).
3. **Microtones:** the 2nd is segâh, a neutral 2nd (~181 c). The whole Saba tetrachord is a *diminished* fourth (~407 c), which 12-TET turns into b4.
   - Greek sources round the 2nd **up** to E natural (1 2 b3 b4). Rounding it down (1 b2 b3 b4, chroma `110110011010`) is also seen in practice (UNVERIFIED in a written Greek source).
   - The page cannot show both, and cannot show the missing octave in a pitch-class model.
4. **Names:** Σαμπάχ, Σαμπά; Turkish *Sabâ*; Arabic *Ṣabā*.
5. **tonal:** no match. Chroma `101110011010`, pitch classes {0,2,3,4,7,8,10}; the Db above the octave is outside this set.
   - Spelling hazard: `4d` (G♭ over D) produces odd third-stacked chords. For example degree 2 gives E–G♭–B♭.
6. **Confidence:** medium-low. **Recommendation:** publish with strong caveat, and mention the lowered upper octave in the text. Consider disabling the triad/seventh table or labelling it as theoretical.

### Νιαβέντ (Niavént)
1. **Formula:** 1 2 b3 #4 5 b6 7, steps W H 1½ H H 1½ H. On D: Ρε μι φα σολ# λα λα# ντο# ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)). Musicheaven describes it (on A) as the minor scale with a raised 4th ([musicheaven.gr](https://www.musicheaven.gr/modules.php?name=News&file=article&id=473)).
2. **Structure:** Νιαβέντ tetrachord (D E F G#) plus a Χιτζάζ tetrachord on A (Katsikias). **Name mismatch:** Turkish *Nihavend* is essentially a minor scale. The Greek shape is Turkish **Neveser**: a Nikriz tetrachord on the tonic plus a Hicaz tetrachord on the 5th, which TDV describes as a nihavend with a raised 4th, "a minor oriental scale" ([TDV Neveser](https://islamansiklopedisi.org.tr/neveser)). The brief's guess "Neveser?" is correct.
3. **Microtones:** minimal (Hicaz-type intervals).
4. **Names:** Νιαβέντ, Νιχαβέντ; Turkish *Nihavend* by name, *Neveser* by structure.
5. **tonal:** `hungarian minor`.
6. **Confidence:** high for the scale; the naming note is required. **Recommendation:** publish with caveat.

### Νικρίζ (Nikríz)
1. **Formula:** 1 2 b3 #4 5 6 b7, steps W H 1½ H W H W. On C: ντο ρε μι♭ φα# σολ λα σι♭ ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)).
2. **Structure:** Νικρίζ pentachord plus a minor tetrachord. The Turkish version: Nikriz pentachord on rast plus Rast and Bûselik tetrachords on nevâ; tonic rast ([TDV Nikriz](https://islamansiklopedisi.org.tr/nikriz)). The upper tetrachord's 7th therefore varies between a near-natural 7th (Rast) and b7 (Bûselik). Greek sources give b7.
   - Katsikias notes it "derives from Χιτζάζ, played from the 7th degree", i.e. the same pitch classes as Χιτζάζ one whole tone higher.
   - He also gives an alias "Σουζινάκ" / "Ποιμενικό μινόρε" (pastoral minor). This conflicts with Turkish *Sûzinak* (Rast pentachord plus Hicaz tetrachord), so it is UNVERIFIED as an equivalence.
3. **Microtones:** minimal; the augmented 2nd is ~13 commas.
4. **Names:** Νικρίζ; Turkish *Nikrîz*.
5. **tonal:** `dorian #4` (aliases `ukrainian dorian`, `romanian minor`, `altered dorian`).
6. **Confidence:** high. **Recommendation:** publish with caveat.

### Χουζάμ (Houzám)
1. **Formula (Greek form):** 1 #2 3 4 5 b6 7, steps 1½ H H W H 1½ H.
   - On D: ρε μι# φα# σολ λα σι♭ ντο#, written "ΤΡ-Η-Η-Τ-Η-ΤΡ-Η" ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)).
   - A Greek forum thread lists four competing "Χουζάμ/Σεγκιάχ" step patterns. All start 3Η-Η-Η; this one is among them ([rembetiko.gr: Χουζάμ, Σεγκιάχ ή κάτι άλλο;](https://rembetiko.gr/t/%CF%87%CE%BF%CF%85%CE%B6%CE%AC%CE%BC-%CF%83%CE%B5%CE%B3%CE%BA%CE%B9%CE%AC%CF%87-%CE%AE-%CE%BA%CE%AC%CF%84%CE%B9-%CE%AC%CE%BB%CE%BB%CE%BF/13795)). A participant there calls the naming "a broken telephone… reversed names for tempered modes".
2. **Structure:** "Χουζάμ tetrachord" (D E# F# G) plus a disjunct Χιτζάζ tetrachord on A, or plus a conjunct Νικρίζ pentachord (Katsikias). The Turkish version: Hüzzam pentachord on segâh plus a Hicaz tetrachord higher up; tonic **segâh**, i.e. the tonic itself is a koma-flat B ([TDV Hüzzam](https://islamansiklopedisi.org.tr/huzzam)).
   - Delegos transcribes an "equal tempered makam Huzzam" introduction (Toundas, "Μπήκε ο χειμώνας", 1940) whose key signature mixes flats and sharps ([p. 344](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)).
3. **Microtones:** this is the core problem. The Turkish tonic is a neutral pitch, so no 12-TET scale on D represents Hüzzam faithfully. The Greek D-E#-F# start looks like both chromatic neighbours of the neutral pitch being kept (Delegos notes E# as a "Segah" marker in D-Rast). This is my inference, not a sourced claim.
4. **Names:** Χουζάμ, Χουζάμι; Turkish *Hüzzam*.
5. **tonal:** the pitch-class set {0,3,4,5,7,8,11} is identical to `tonal`'s **`augmented heptatonic`** (1 #2 3 4 5 #5 7). That name and spelling would mislead users. Use the set internally only, under a custom name.
6. **Confidence:** low. **Recommendation:** hold back from v1, or publish with strong caveat text stating that the form is a Greek fretted convention and that sources disagree.

### Πειραιώτικος (Peiraiótikos)
1. **Formula:** 1 b2 3 #4 5 b6 b7, steps H 1½ W H H W W. On D: ρε μι♭ φα# σολ# λα σι♭ ντο, described as "a Χιτζάζ with the 4th raised" ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)).
   - **Variant:** with C# (1 b2 3 #4 5 b6 7). A Greek forum search result gives both "...Σι♭ Ντο# Ρε" and "...Σι♭ Ντο" ([rembetiko.gr: Πειραιώτικος δρόμος](https://rembetiko.gr/t/%CF%80%CE%B5%CE%B9%CF%81%CE%B1%CE%B9%CF%8E%CF%84%CE%B9%CE%BA%CE%BF%CF%82-%CE%B4%CF%81%CF%8C%CE%BC%CE%BF%CF%82/14021)).
2. **Structure and origin:** a Greek/Piraeus dromos with no single Turkish equivalent. Forum participants cite three theories: Voúlgaris links it to "Ζιργκιουλελί Σουζινάκ με μόνιμη δίεση στην 4η", others to Sirf Hicazkar, and "liga_rosa" calls it "a Hicazkar with a permanent attraction on the 4th". All of these are secondhand forum citations, so UNVERIFIED.
3. **Microtones:** few. It is a Greek tempered construction.
4. **Names:** Πειραιώτικος (δρόμος), "Πειραιώτικο".
5. **tonal:** the b7 form has no match (chroma `110010111010`). The C# form = `double harmonic lydian`.
6. **Confidence:** medium-low. **Recommendation:** publish the b7 form (the most common textual definition) with a caveat that names the C# variant.

### Καρσιγάρ (Karsigár)
1. **Formula (Greek):** 1 2 b3 4 b5 6 b7, steps W H W H 1½ H W. On D: ρε μι φα σολ λα♭ σι ντο ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)).
2. **Structure:** Ουσάκ/"Γκιουρντί" tetrachord plus a Χιτζάζ pentachord on the 4th. The Turkish version: Uşşak tetrachord on dügâh plus Hicaz pentachord on nevâ; tonic dügâh; half-cadence on nevâ with hicaz colour ([TDV Karcığar](https://islamansiklopedisi.org.tr/karcigar)). Turkish sources also mention a characteristic suspension on çârgâh named the Nikriz pentachord (TDV / [Sâlih Bora](https://www.salihbora.com/makamlarimiz/karcigar-makami/), secondary).
3. **Microtones:** the 2nd is Uşşak's neutral 2nd. Greek sources round it **up** (E natural). Rounding down gives 1 b2 b3 4 b5 6 b7 (= `tonal` `locrian 6`). Delegos lists Karcığar with Saba as makams that resist two-voice harmonization in the equal-tempered context ([p. 348](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)).
4. **Names:** Καρσιγάρ, Καρτσιγάρ, Καρσιλαμάς (not the same thing; that is a dance); Turkish *Karcığar*. The same pitch-class set is taught as Greek Κιουρντί (see above).
5. **tonal:** no match for the Greek form (chroma `101101100110`). The b2 variant = `locrian 6`.
6. **Confidence:** medium. **Recommendation:** publish with caveat.

### Σεγκιάχ (Segkiáh)
1. **Formula (Greek form):** ascending 1 #2 3 4 5 6 7, steps 1½ H H W W W H. Descending: b7 (3Η-Η-Η-Τ-Τ-Η-Τ, per the forum list). On D: ρε μι# φα# σολ λα σι ντο#, written "ΤΡ-Η-Η-Τ-Τ-Τ-Η" ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis); [rembetiko.gr thread](https://rembetiko.gr/t/%CF%87%CE%BF%CF%85%CE%B6%CE%AC%CE%BC-%CF%83%CE%B5%CE%B3%CE%BA%CE%B9%CE%AC%CF%87-%CE%AE-%CE%BA%CE%AC%CF%84%CE%B9-%CE%AC%CE%BB%CE%BB%CE%BF/13795)).
2. **Structure:** "Χουζάμ tetrachord" plus a disjunct Ραστ (major) tetrachord (Katsikias). The only difference from Χουζάμ is the 6th: natural vs b6.
   - Turkish Segâh: segâh fifth on segâh plus a hicaz tetrachord on eviç, with the tonic on the koma-flat B ([TDV Segâh](https://islamansiklopedisi.org.tr/segah)).
   - In Turkish theory Segâh and Hüzzam are both rooted on Rast's 3rd degree, and a forum participant describes the Greek names as "reversed" (thread above).
   - Delegos: in D-Rast bouzouki melodies, "the presence of E sharp note indicates the Segah character" ([p. 346](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)).
3. **Microtones:** the same fundamental problem as Χουζάμ; the Turkish tonic is a neutral pitch.
4. **Names:** Σεγκιάχ, Σεγκιάχ-Ραστ; Turkish *Segâh*; Arabic *Sīkāh*.
5. **tonal:** no match (chroma `100111010101`). It is a rotation of `tonal` `balinese` (Neapolitan minor).
6. **Confidence:** low. **Recommendation:** hold back, or publish with strong caveat.

### Ματζόρε / Μινόρε (as dromoi)
- **Ματζόρε** is "very close to the western major scale", and Ραστ is often used as a synonym ([Ordoulidis nn. xxv, xxxii](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf)). Map it to `major`.
- **Μινόρε** is "very close to the western minor scales". On the bandstand, though, "D minóre" names **the tonic chord**, not the dromos: the song "may be based on… a D ousák, a D minóre armonikó, a D minóre or a D kiourdí" (p. 6). In practice Μινόρε covers both natural minor and "μινόρε αρμονικό" (harmonic minor).
- **Recommendation:** use Ματζόρε/Μινόρε as Greek aliases on the Western major / natural minor / harmonic minor pages. Do not create one ambiguous "Μινόρε" scale page. Confidence: high.

## Western scales

All formulas below were checked against `tonal`'s `ScaleType` data ([tonal `packages/scale-type/data.ts`](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts), also dumped from the installed 6.4.2). They are 12-TET by construction, so the confidence is high for all of them and the recommendation is to publish as-is.

- **Major / Ιωνικός.** `1P 2M 3M 4P 5P 6M 7M` = `major`, alias `ionian`. Greek: μείζονα (μείζων) κλίμακα, colloquially ματζόρε ([el.wikipedia Κλίμακα](https://el.wikipedia.org/wiki/%CE%9A%CE%BB%CE%AF%CE%BC%CE%B1%CE%BA%CE%B1_(%CE%BC%CE%BF%CF%85%CF%83%CE%B9%CE%BA%CE%AE))).
- **Natural minor / Αιολικός.** `minor`, alias `aeolian`. Greek: φυσική ελάσσονα (el.wikipedia).
- **Harmonic minor.** `harmonic minor`: 1 2 b3 4 5 b6 7. Greek: αρμονική ελάσσονα (colloquially μινόρε αρμονικό, per Ordoulidis). It shares its pitch classes with Χιτζάζ a 5th above: D Χιτζάζ = G harmonic minor from D.
- **Melodic minor.** `tonal` `melodic minor` = 1 2 b3 4 5 6 7, the ascending form only, also called "jazz minor". The classical form reverts to natural minor when descending ([Wikipedia: Minor scale](https://en.wikipedia.org/wiki/Minor_scale)). Greek: μελωδική ελάσσονα. **Recommendation:** show the ascending form, with a note: "στην κλασική πράξη, κατεβαίνοντας γίνεται φυσική ελάσσονα" ("in classical practice it becomes natural minor on the way down"). Jazz uses the ascending form in both directions.
- **Church modes:** `dorian`, `phrygian`, `lydian`, `mixolydian` (alias `dominant`), `locrian`, plus `ionian` and `aeolian`. The formulas are in the table.
  - Greek: δώριος / φρύγιος / λύδιος / μιξολύδιος / αιολικός / λόκριος / ιωνικός **τρόπος**. Only δώριος/δωρικός, λύδιος and φρύγιος were confirmed in the fetched source; the other forms are standard usage but UNVERIFIED against a conservatory text.
  - Note: the ancient Greek *tonoi* with the same names are different scales from the modern church modes. el.wikipedia uses the ancient sense.
- **Pentatonics.** `major pentatonic` (alias `pentatonic`) = 1 2 3 5 6; `minor pentatonic` = 1 b3 4 5 b7. Greek: πεντατονική (confirmed); μείζονα/ελάσσονα πεντατονική is UNVERIFIED usage. Recommendation: skip diatonic triad/seventh tables for 5- and 6-note scales, because stacking thirds on them is not standard.
- **Blues.** The conventional "blues scale" is the hexatonic minor blues, 1 b3 4 b5 5 b7 ([Wikipedia: Blues scale](https://en.wikipedia.org/wiki/Blues_scale), citing Greenblatt 2011). In `tonal` this is `minor blues`, alias `blues`. Major blues is 1 2 b3 3 5 6 = `major blues`. Greek "κλίμακα μπλουζ" is UNVERIFIED usage.
- **Greek step terms:** τόνος, ημιτόνιο, τριημιτόνιο, διάστημα (interval) (el.wikipedia). Dromoi sources abbreviate them Τ, Η, ΤΡ or 3Η ([Katsikias](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis); [rembetiko.gr](https://rembetiko.gr/t/%CF%87%CE%BF%CF%85%CE%B6%CE%AC%CE%BC-%CF%83%CE%B5%CE%B3%CE%BA%CE%B9%CE%AC%CF%87-%CE%AE-%CE%BA%CE%AC%CF%84%CE%B9-%CE%AC%CE%BB%CE%BB%CE%BF/13795)).

## Collisions in 12-TET

| Same pitch-class set | Difference in practice |
|---|---|
| **Ουσάκ = Φρύγιος** (= Turkish Kürdî) | Same tonic and set. Ουσάκ has an unstable 2nd (flat or natural by direction), a 6th pulled up to the 7th, and a rast pentachord below the tonic (Ordoulidis). Phrygian has none of these. |
| **Κιουρντί (GR) = Καρσιγάρ (GR)** | The same set in Greek teaching; one source lists them as a single entry, "Γκιουρντί/Καρσιγάρ". Pick one canonical page and list the other as an alias, or hold Κιουρντί back. |
| **Ραστ = Ματζόρε = Μείζονα/Ιωνικός** | Ραστ has a neutral 3rd and 7th in the makam, a b7 on descent, and makam seyir (nevâ as the strong note). |
| **Ραστ (descending) = Μιξολύδιος** | Direction-dependent only. |
| **Μινόρε ⊇ φυσική & αρμονική ελάσσονα** | A bandstand label for the tonic chord, not one scale. |
| **Χιτζάζ (D) = αρμονική ελάσσονα (G) = Νικρίζ (C)** | Same 7 pitch classes on different tonics. `tonal` confirms rotations: `dorian #4` and `harmonic minor` are modes of `phrygian dominant`. The emphasized degrees and cadences decide which one you hear. |
| **Χιτζαζκιάρ (D) = Νιαβέντ (G)** | `hungarian minor` is a rotation of `double harmonic major` (from `tonal` chroma rotation). |
| **Καρσιγάρ variant with b2 = locrian 6 = a mode of harmonic minor** | Only if the neutral 2nd is rounded down. Greek sources round it up. |
| **Χουζάμ vs Σεγκιάχ (GR forms)** | Differ only in the 6th (b6 vs 6); the source naming is contested. |
| **Χουζάμ (GR) = `augmented heptatonic`** | A coincidental match; the Western name would mislead users. |
| **Σαμπάχ (Eb variant) = Turkish Hüzzam rounded from segâh** (0 1 3 4 7 8 10) | Arithmetic from AEU commas (my calculation, UNVERIFIED in the literature). Shows how rounding choices can make different makams collide. |

**Implementation notes:**

- Dromoi that share a set with another scale need distinct pages keyed by **dromos and tonic**, not by pitch-class set. Each page should state emphasized notes and cadence notes where the sources give them. So far only Χιτζάζ and Ουσάκ have published dominant notes and cadences (Ordoulidis figs. 9–11).
- For the sets with no `tonal` match (Κιουρντί/Καρσιγάρ, Σαμπάχ, Χουζάμ, Σεγκιάχ, Πειραιώτικος), you can register custom types with `ScaleType.add(intervals, name)`. This keeps `Scale.get("D sabah")` working.
- Choose the interval spellings deliberately; these are suggestions:
  - Σαμπάχ: `1P 2M 3m 4d 5P 6m 7m`
  - Χουζάμ/Σεγκιάχ: `1P 2A 3M 4P 5P ...`, which gives E# in D the way Greek sources spell it

  Check that chord detection over these spellings does not produce unreadable symbols.

## Suggested caveat copy (Greek)

The two variants below cover different points; use both or pick one depending on space.

**General (every dromos page):**
> Οι δρόμοι παρουσιάζονται εδώ όπως παίζονται σε όργανα με τάστα (μπουζούκι, κιθάρα, πιάνο), δηλαδή με τόνους και ημιτόνια. Τα μακάμ από τα οποία προέρχονται έχουν και μικροδιαστήματα, που η φωνή, το βιολί ή το ούτι αποδίδουν αλλά τα τάστα όχι. Και ένας δρόμος δεν είναι μόνο σκάλα: μετράει ποια νότα είναι η τονική, πού «πατάει» και πώς κινείται η μελωδία. Γι' αυτό δύο δρόμοι με τις ίδιες νότες μπορεί να ακούγονται διαφορετικά.

**Naming note (Ουσάκ, Κιουρντί, Νιαβέντ, Χουζάμ, Σεγκιάχ):**
> Τα ονόματα των ελληνικών δρόμων δεν ταυτίζονται πάντα με τα ομώνυμα τουρκικά μακάμ. Για παράδειγμα, ο δικός μας Ουσάκ αντιστοιχεί στο μακάμ Kürdî. Εδώ ακολουθούμε τη χρήση των Ελλήνων μουσικών.

**Extra line for Σαμπάχ / Χουζάμ / Σεγκιάχ:**
> Σε αυτόν τον δρόμο οι πηγές διαφωνούν για ορισμένες νότες, γιατί στο πρωτότυπο μακάμ πέφτουν ανάμεσα σε δύο τάστα. Δείχνουμε την πιο διαδεδομένη εκδοχή για μπουζούκι.

**Harmony note (dromos pages that show a chord table):**
> Οι συγχορδίες που προκύπτουν από τις νότες του δρόμου είναι θεωρητικές. Στο ρεμπέτικο κάθε δρόμος συνοδεύεται συνήθως από λίγες, συγκεκριμένες συγχορδίες.

## Sources

**Primary / academic**
- Ordoulidis, N. (2011). "The Greek Popular Modes." *British Postgraduate Musicology* 11. [PDF](http://britishpostgraduatemusicology.org/bpm11/ordoulidis_the_greek_popular_modes.pdf). Read in full; the notated figures were not readable.
- Delegos, S. Th. (2021). "Modality vs. Chordal Harmony: Hybrid Aspects of Rebetiko During the Interwar Period." *Series Musicologica Balcanica* 1.2. [doi:10.26262/smb.v1i2.7945](https://ejournals.lib.auth.gr/smb/article/download/7945/7801)
- Pennanen, R. P. (1997). "The Development of Chordal Harmony in Greek Rebetika and Laika Music, 1930s to 1960s." *British Journal of Ethnomusicology* 6. Cited via Ordoulidis and Delegos; not read directly ([academia.edu](https://www.academia.edu/6666538/The_Development_of_Chordal_Harmony_in_Greek_Rebetika_and_Laika_Music_1930s_to_1960s), access blocked).
- Pennanen, R. P. (1999). *Westernisation and Modernisation in Greek Popular Music*. Tampere UP; and (2004) "The Nationalization of Ottoman Popular Music in Greece," *Ethnomusicology* 48(1). Cited via Ordoulidis and Delegos.
- "Westernisation of rebetiko modes: dromoi brightness and darkness" (2021), [academia.edu](https://www.academia.edu/78315174/Westernisation_of_rebetiko_modes_dromoi_brightness_and_darkness). Blocked (HTTP 403); author and contents UNVERIFIED.
- Özkan, İ. H. Entries in *TDV İslâm Ansiklopedisi*: [Hicaz](https://islamansiklopedisi.org.tr/hicaz--musiki), [Hicazkâr](https://islamansiklopedisi.org.tr/hicazkar), [Rast](https://islamansiklopedisi.org.tr/rast), [Uşşak](https://islamansiklopedisi.org.tr/ussak), [Kürdî](https://islamansiklopedisi.org.tr/kurdi), [Karcığar](https://islamansiklopedisi.org.tr/karcigar), [Sabâ](https://islamansiklopedisi.org.tr/saba), [Nikriz](https://islamansiklopedisi.org.tr/nikriz), [Neveser](https://islamansiklopedisi.org.tr/neveser), [Hüzzam](https://islamansiklopedisi.org.tr/huzzam), [Segâh](https://islamansiklopedisi.org.tr/segah)
- tonal source: [packages/scale-type/data.ts](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts), cross-checked against the installed `tonal@6.4.2`.
- Not consulted (not available online): Signell, *Makam: Modal Practice in Turkish Art Music*; Mavroeidis, *Οι μουσικοί τρόποι στην Ανατολική Μεσόγειο*; Voúlgaris & Vandarákis (2007). Several claims above would firm up with these, especially Κιουρντί, Χουζάμ, Σεγκιάχ and Πειραιώτικος.

**Encyclopedic**
- [Wikipedia: Turkish makam](https://en.wikipedia.org/wiki/Turkish_makam) (AEU comma sizes)
- [Wikipedia: Blues scale](https://en.wikipedia.org/wiki/Blues_scale)
- [Wikipedia: Minor scale](https://en.wikipedia.org/wiki/Minor_scale)
- [el.wikipedia: Κλίμακα (μουσική)](https://el.wikipedia.org/wiki/%CE%9A%CE%BB%CE%AF%CE%BC%CE%B1%CE%BA%CE%B1_(%CE%BC%CE%BF%CF%85%CF%83%CE%B9%CE%BA%CE%AE))

**Secondary (corroboration only; disagreements recorded above)**
- Katsikias, N. "Δρόμοι Μουσικής", Greek school-network teacher page: [users.sch.gr](http://users.sch.gr/nkatsikias/joomla2015/index.php/mousiki/dromoi-mousikis)
- musicheaven.gr, "Λαϊκοί Δρόμοι (Μέρος Α')": [link](https://www.musicheaven.gr/modules.php?name=News&file=article&id=473)
- Rembetiko Forum threads: [Χουζάμ, Σεγκιάχ ή κάτι άλλο;](https://rembetiko.gr/t/%CF%87%CE%BF%CF%85%CE%B6%CE%AC%CE%BC-%CF%83%CE%B5%CE%B3%CE%BA%CE%B9%CE%AC%CF%87-%CE%AE-%CE%BA%CE%AC%CF%84%CE%B9-%CE%AC%CE%BB%CE%BB%CE%BF/13795), [Πειραιώτικος δρόμος](https://rembetiko.gr/t/%CF%80%CE%B5%CE%B9%CF%81%CE%B1%CE%B9%CF%8E%CF%84%CE%B9%CE%BA%CE%BF%CF%82-%CE%B4%CF%81%CF%8C%CE%BC%CE%BF%CF%82/14021), [Ο δρόμος Σαμπάχ](https://rembetiko.gr/t/%CE%BF-%CE%B4%CF%81%CF%8C%CE%BC%CE%BF%CF%82-%CF%83%CE%B1%CE%BC%CF%80%CE%AC%CF%87/12968)
- Sâlih Bora, [Karcığar Makâmı](https://www.salihbora.com/makamlarimiz/karcigar-makami/)
- One English-language hobbyist dromoi listing was consulted for corroboration (Κιουρντί ascending/descending, the Πειραιώτικος C# variant). It is deliberately not named or linked, per the project's sourcing policy.