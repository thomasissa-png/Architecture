# Validation v53 — Impact Outdoor — Camille Verdier — 5 avril 2026

## 1. Les builders outdoor utilisent-ils les constantes v53 ?

**NON.** Les builders indoor passe 1 utilisent `PASS1_PREAMBLE_V53`, `PRESERVATION_V53`, `CLEANUP_V53` (condenses, ~220 mots). Les builders outdoor (`buildOutdoorSurfacesResponsesPrompt`, `buildOutdoorFurnitureResponsesPrompt`) utilisent les **anciennes** constantes : `CAMERA_PRESERVATION`, `LIGHT_PRESERVATION`, `ANTI_INVENTION`, `PASS2_ANTI_INVENTION`. Ils n'ont pas ete touches par v53.

## 2. Longueur et condensation

Le builder outdoor passe 1 assemble ~13 lignes de directives avec les anciennes constantes longues (`CAMERA_PRESERVATION` seul = ~65 mots). Estimation : **~280-320 mots** au total. C'est 30-40% plus long que les builders indoor v53 (~220 mots). La passe 2 outdoor est encore plus longue (~350 mots avec le furniturePrompt injecte). **Risque modere** : dilution des tokens tardifs sur gpt-image-1.5, mais moins critique qu'indoor car les outdoor ont moins de contraintes structurelles (pas de plafond, pas de luminaire).

**Verdict : condensation souhaitable (P2) mais pas urgente.** Les outdoor fonctionnent bien a v51 (score 8.2/10 au re-audit). Aligner sur v53 quand l'occasion se presente.

## 3. Preservation des elements exterieurs

**Bonne.** Les directives couvrent : garde-corps, facades, murs, portails, clotures, vegetation existante, niveaux de sol, joints de dilatation, regards metalliques, grilles, baies vitrees. La directive `OUTDOOR_ANTI_FENETRE` compte explicitement les ouvertures. Le subtype `balcon` preserve les garde-corps, `jardin` preserve la vegetation de fond. **Point d'attention** : les murets bas et bordures ne sont pas nommes explicitement — ils sont couverts par "walls and fences" mais un muret 40cm pourrait etre ignore par le modele. P3 mineur.

## 4. Transmission des styles outdoor

**Correcte.** `outdoor-styles.ts` fournit `surfacePrompt` et `furniturePrompt` separes. Le routing dans `tryOpenAIResponses` (lignes 606-610) et dans le builder principal (lignes 952-955) branche bien sur les fonctions outdoor quand `outdoor.isOutdoor === true`. Les `subtypeOverrides` sont concatenes. La chaine est integre.

## 5. Note globale outdoor /10

| Critere | Note |
|---|---|
| Preservation spatiale (x3) | 8/10 — solide, murets bas = seul angle mort |
| Fidelite stylistique (x2) | 8/10 — styles bien differencies, choose-one = variete |
| Choix vegetal | 8/10 — especes correctes, echelle conditionnelle |
| Materiaux sol | 8/10 — joints, formats, mortier nommes |
| Mobilier outdoor | 8/10 — echelle adaptee, Sunbrella mentionne |
| Eclairage | 8/10 — "unlit daytime" present partout |
| Composition spatiale | 7/10 — distribution profondeur OK, laterale absente outdoor |
| Echelle et proportions | 8/10 — conditionnelle balcon/jardin |
| Ambiance et coherence | 8/10 — lived-in details presents |
| Photorealisme | 7/10 — DSLR_LINE present, pas de grain (conforme fondateur) |

**Note ponderee : 7.9 / 10** — Les outdoor v51 tiennent bien. Pas de regression v53.

### Actions recommandees
- **P2** : Condenser les builders outdoor sur le modele v53 (STRUCTURE LOCK + PRESERVATION condenses)
- **P3** : Nommer "low walls, raised borders, stone edging" dans la preservation passe 1
