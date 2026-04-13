# Audit QA - 7 Quality Gates Extraction de Plan

Date : 2026-04-13 | Fichiers audites : `lib/marchand/plan-extractor.ts`, `app/api/pro/projects/[id]/extract/route.ts`, `app/projet/[id]/extraction/page.tsx`

## Score global : 7.8 / 10

## Evaluation par critere

| # | Critere | Note | Detail |
|---|---------|------|--------|
| 1 | Completude | 7/10 | Pas de gate pour pieces sans surface (surface_m2 = null sur toutes les pieces = plan illisible). Pas de gate pour confidence moyenne < 0.5. G7 ne detecte les doublons que si name_raw est IDENTIQUE — "Salon" vs "Sejour" avec meme bbox passe. |
| 2 | Seuils | 8/10 | 80m² OK pour residentiel mais bloquant pour local commercial/loft. 300m² OK par etage. G3 tolere 105% (marge 5%) — justifie mais non documente. G4 seuil 1% trop bas : une piece de 2m² dans un plan de 200m² = 1% de l'image, risque faux positif. G5 seuil 0.2 trop permissif — un bbox 5x trop petit passe. |
| 3 | Retry logic | 7/10 | Un seul retry, pas de boucle infinie — OK. MAIS : le retry relance exactement le meme appel (meme prompt, meme image) sans varier la temperature ni le prompt. Probabilite que le retry corrige une erreur de surface GPT sans changement de prompt : faible. Le retry de route.ts et celui de plan-extractor.ts (sleep 5s) sont independants — au pire 4 appels API (2 internes x 2 route) sans que le code le sache. |
| 4 | Frontend warnings | 8/10 | Messages en francais, clairs, bloc jaune avec icone warning — bon pour Thomas. MAIS : aucun warning ne dit QUOI corriger. "Verifiez les surfaces manuellement" sans dire lesquelles. G3/G4/G5 n'emettent pas de warning du tout (seuls G1, G2, G6 en emettent). Thomas voit un score 71/100 sans savoir pourquoi. |
| 5 | Testabilite | 8/10 | `validateExtraction` est une pure function — parfaitement testable. MAIS : zero test unitaire existant pour cette fonction (le fichier test couvre extractPlanData et extractMultiplePlans, pas validateExtraction ni sanitizeSurfaces). |

## Bugs et lacunes (< 9.5 = corrections requises)

### P0 — Zero test pour validateExtraction et sanitizeSurfaces

Le fichier `tests/unit/marchand/plan-extractor.test.ts` ne contient aucun test pour les 7 gates ni pour sanitizeSurfaces. Ces fonctions pures sont le cas ideal pour des tests unitaires exhaustifs.

**Action** : ecrire un describe("validateExtraction") avec au minimum 1 test par gate (7 tests) + 1 test sanitizeSurfaces (facteur 10x) + 1 test sanitizeSurfaces (cm vers m).

### P1 — G3/G4/G5 silencieux cote frontend

Gates G3, G4, G5 peuvent FAIL sans emettre de warning utilisateur. Thomas voit un score degrade sans explication.

**Diff** (`lib/marchand/plan-extractor.ts`, apres le push de G5) :

```diff
+  if (!proportionalOk) {
+    warnings.push("Les tailles visuelles des pièces ne semblent pas proportionnelles aux surfaces. Vérifiez le positionnement.");
+  }
```

Meme pattern pour G3 (le warning existe deja) et G4 :

```diff
+  if (emptyBoxes.length > 0) {
+    warnings.push(`${emptyBoxes.length} pièce(s) sans position sur le plan. Repositionnez-les manuellement.`);
+  }
```

### P1 — G7 doublon trop strict sur name_raw exact

Deux pieces "Chambre 1" et "Chambre 2" avec bbox proches ne sont pas detectees. Inversement, deux chambres nommees differemment mais au meme endroit passent.

**Diff** (`lib/marchand/plan-extractor.ts`, dans la boucle G7) :

```diff
-      if (a.name_raw === b.name_raw && a.bounding_box && b.bounding_box) {
+      if (a.bounding_box && b.bounding_box) {
         const overlap = Math.abs(a.bounding_box.x_percent - b.bounding_box.x_percent) < 5
           && Math.abs(a.bounding_box.y_percent - b.bounding_box.y_percent) < 5;
-        if (overlap) duplicates++;
+        if (overlap && a.bounding_box.width_percent > 0 && b.bounding_box.width_percent > 0) duplicates++;
       }
```

### P2 — Retry aveugle (meme prompt = meme erreur)

Le retry dans route.ts relance `extractMultiplePlans` avec les memes inputs. Si GPT hallucine des surfaces 10x trop grandes, sanitizeSurfaces les corrige deja — le retry n'ajoute rien.

**Recommandation** : ajouter un flag `retryHint` dans le prompt ("Your previous extraction had surfaces > 80m2, re-read carefully") ou augmenter la temperature a 0.3 sur le retry. Pas de diff exact car c'est un choix d'architecture a valider avec @fullstack et @ia.

### P2 — Pas de gate "toutes surfaces null"

Si GPT retourne 5 pieces avec `surface_m2: null` partout, les 7 gates passent (aucune > 80m², total = 0 < 300, etc.). Thomas recoit un score 100/100 sur un plan ou aucune surface n'est lisible.

**Diff** (`lib/marchand/plan-extractor.ts`, apres G7) :

```diff
+  // GATE 8 — At least 50% of rooms have a surface
+  const roomsWithSurface = data.rooms.filter(r => r.surface_m2 !== null).length;
+  const surfaceCoverage = data.rooms.length > 0 ? roomsWithSurface / data.rooms.length : 0;
+  gates.push({
+    id: "G8_SURFACE_COVERAGE",
+    label: "Surfaces détectées sur la majorité des pièces",
+    passed: surfaceCoverage >= 0.5,
+    detail: surfaceCoverage < 0.5 ? `Seulement ${roomsWithSurface}/${data.rooms.length} pièces avec surface` : undefined,
+  });
+  if (surfaceCoverage < 0.5) {
+    warnings.push("La majorité des surfaces n'ont pas pu être lues. Saisissez-les manuellement.");
+  }
```

## Synthese

| Correction | Severite | Effort |
|------------|----------|--------|
| Ecrire tests validateExtraction + sanitizeSurfaces | P0 | 1h |
| Ajouter warnings FR pour G3/G4/G5 | P1 | 15min |
| G7 doublon par bbox seul (sans name_raw) | P1 | 10min |
| G8 couverture surfaces non-null | P2 | 15min |
| Retry avec hint/temperature | P2 | 30min |

Handoff : corrections P0/P1 a implementer par @fullstack, tests par @qa.
