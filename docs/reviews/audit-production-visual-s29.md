# Audit Visuel Production — Session 29

**Date** : 2026-03-31  
**Générations auditées** : #74, #78, #79, #80, #81 (les 5 plus récentes)  
**Pipeline** : GPT-Image-1.5 via Responses API, 2 passes (surfaces → mobilier)  
**Version prompts** : v30

---

## Résultats par génération

### #80 Scandinavian (intérieur, 2 passes) — 8.2/10

**Input** : Pièce en chantier brut — poutres exposées, murs non finis, sol brut, néons fluorescents, personnes présentes, chaudière murale.

**Passe 1** : Transformation remarquable — murs blancs propres, sol whitewashed ash impeccable, luminaire PH5-style correctement rendu (couches distinctes). Chaudière murale PRÉSERVÉE. Géométrie du plafond avec poutre diagonale respectée. Fenêtres identiques. Stores noirs conservés.

**Passe 2** : Mobilier scandinave cohérent — canapé beige boucle, table basse bois clair, fauteuil type Wegner, lampadaire noir (AJ-style), tapis crème, plante.

| Critère | Note |
|---|---|
| Fidélité stylistique | 8.5 |
| Crédibilité pro | 8.5 |
| Préservation géométrie | 9.0 |
| Cohérence éclairage | 8.0 |
| Échelle mobilier | 8.0 |
| Distribution spatiale | 7.0 (concentré premier plan) |

**Forces** : PH5 bien rendu, chaudière conservée, poutre diagonale préservée.  
**Faiblesses** : Mobilier concentré au premier plan, fond de pièce vide.

---

### #79 Contemporary (intérieur, 2 passes) — 7.8/10

**Input** : Même pièce chantier que #80.

**Output** : Canapé d'angle charcoal, table basse smoked glass/bronze, lampadaire discret, tapis gris. Spots encastrés au plafond. Sol engineered stone gris. Tableau abstrait posé au sol + accroché au mur.

| Critère | Note |
|---|---|
| Fidélité stylistique | 8.0 |
| Crédibilité pro | 8.0 |
| Préservation géométrie | 8.5 |
| Cohérence éclairage | 7.5 |
| Échelle mobilier | 8.0 |
| Distribution spatiale | 7.5 |

**Forces** : Sol engineered stone transition réussie, spots cohérents, rendu éditorial.  
**Faiblesses** : Art mural ACCROCHÉ (viole "no wall art" du builder), léger warm shift murs.

---

### #78 Provençal outdoor (terrasse/patio) — 7.5/10

**Output** : Table ronde fer forgé + 4 chaises coussins blancs, fontaine murale pierre, cyprès en pot, lavande en jardinière, lanterne au sol. Structure métallique pergola préservée.

| Critère | Note |
|---|---|
| Fidélité stylistique | 8.5 |
| Crédibilité pro | 8.0 |
| Préservation géométrie | 6.5 (sur-transformation possible) |
| Qualité visuelle | 8.5 |
| Mobilier extérieur | 8.0 |

**Forces** : Visuellement magnifique, fer forgé et lavande typiques, fontaine bien rendue.  
**Faiblesses** : Architecture potentiellement recréée (murs calcaire très travaillés), fontaine = élément mural fixe pas freestanding.

---

### #74 Bohemian SDB (salle de bain, 2 passes) — 8.5/10

**Input** : Minuscule SDB vétuste — carrelage sale, baignoire usée, radiateur au sol, éclairage sombre.

**Output** : SDB transformée — suspension rotin, meuble vasque bois, miroir LED rétroéclairé, douche vitrée sur baignoire, tabouret bois, échelle porte-serviettes, panier osier, plante. Radiateur électrique PRÉSERVÉ.

| Critère | Note |
|---|---|
| Fidélité stylistique | 8.5 |
| Crédibilité pro | 9.0 |
| Préservation géométrie | 8.0 |
| Cohérence éclairage | 8.5 |
| Échelle mobilier | 8.0 |
| Habitabilité | 9.0 |

**Forces** : Meilleure génération — transformation crédible d'espace vétuste, radiateur préservé, bohème adapté SDB (rotin, bois, plantes). Digne d'un portfolio pro.  
**Faiblesses** : Pièce semble légèrement plus grande que l'input (wide-angle amplifié).

---

### #81 Contemporary iteration — 3.0/10

**Output** : Salon complètement différent de l'input #79 — parquet bois, canapé beige, mobilier mid-century. Énorme Mickey Mouse noir et blanc sur le mur du fond. Texte halluciné "Learne Slains" et "@netlycalk".

| Critère | Note |
|---|---|
| Préservation géométrie | 1.0 (pièce différente) |
| Qualité visuelle | 4.0 |
| Artefacts IA | 1.0 (texte, personnage copyright) |

**CRITIQUE** : Itération ratée — géométrie perdue, texte halluciné, personnage Disney non autorisé. Cas isolé mais grave.

---

## Synthèse

| # | Style | Note | Verdict |
|---|---|---|---|
| #80 | Scandinavian | **8.2/10** | Excellent |
| #79 | Contemporary | **7.8/10** | Bon |
| #78 | Provençal outdoor | **7.5/10** | Bon |
| #74 | Bohemian SDB | **8.5/10** | Excellent |
| #81 | Contemporary iter | **3.0/10** | Échec |

**Moyenne (hors itération ratée) : 8.0/10**  
**Moyenne globale : 7.0/10**

---

## Corrections appliquées suite à cet audit

1. **P0** : "warm" supprimé du surfacePrompt Contemporary ("very light warm grey" → "very light neutral grey")
2. **P0** : "warm" supprimé du surfacePrompt Bohemian ("soft warm off-white" → "soft off-white")
3. **P1** : Bohème kilim pouf ajouté comme pièce signature (pre-audit, recommandation Yann)
4. **P1** : Haussmannien chandelier détaillé (pre-audit, recommandation Yann)
5. **P1** : Builder generic pass2 condensé 250→180 mots (pre-audit, recommandation Lucas)

## Points à surveiller en production

1. **Distribution profondeur** : Le mobilier reste concentré au premier plan (#80). La directive est présente mais le modèle ne crée pas toujours un groupe secondaire en arrière-plan.
2. **Art mural** : Le modèle accroche parfois des tableaux malgré "no wall art" (#79). Le furniturePrompt Contemporary mentionne un canvas "leaning against baseboard" mais le modèle l'a accroché.
3. **Outdoor builders** : Moins itérés que les intérieurs. Le #78 Provençal est visuellement beau mais la préservation géométrique est moins fiable.
4. **Itérations** : Le #81 montre qu'une itération peut déraille complètement. Surveiller la qualité des itérations.

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/audit-production-visual-s29.md`
- 2 corrections P0 appliquées (warm shift Contemporary + Bohemian)
- 3 corrections P1 appliquées (Bohème pouf, Haussmannien chandelier, pass2 condensé)
- Pipeline 2 passes GPT-Image-1.5 validé à 8.0/10 moyenne (hors itération ratée)
