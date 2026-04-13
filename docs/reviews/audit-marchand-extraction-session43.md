# Audit Marchand -- Extraction + PlanEditor (Session 43)

> Thomas Berger, 35 ans, marchand de biens, Bordeaux, 8-12 ops/an
> Fichiers : `app/projet/[id]/extraction/page.tsx` (1029 l.) + `components/marchand/PlanEditor.tsx` (1763 l.)
> Baseline : session 42 = 8.2, audit final = 8.8. Seuil : 9.5/10.
> Date : 2026-04-13

---

## Grille

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Comprehension immediate | 9.5 | Titre clair "Extraction du plan", sous-titre explicatif, affordance pills ("Deplacer", "Redimensionner", "Double-clic = renommer"), aide collapsible. En 5 secondes je sais quoi faire. |
| 2 | Efficacite plan editor | 8.5 | Drag + resize + snap-to-grid + guides alignement + undo/redo = solide. Fusion mobile bien pensee ("Fusionner avec..."). Mais la calibration est cachee derriere "Options" (P1-1). |
| 3 | Clarte des informations | 9.0 | Noms 13px, surfaces 12px, badges confiance (Fiable/A verifier/Incertain), emojis par type. Clair. Warning surfaces indicatives en bas. Petit bruit : legende ne montre que 6 types sur 17 (P2). |
| 4 | Gestion multi-etages | 9.0 | Tabs "RDC / Etage 1" en pills sage, synchro plan+liste, re-init du plan a chaque switch. Fonctionne. Pas de drag de piece entre etages (acceptable). |
| 5 | Feedback visuel | 9.0 | Loading : scan line + timer + dots pulsants. Erreur : bandeau rouge + "Reessayer" + "Saisir manuellement". Succes : bandeau vert. Badge "Modifie" quand plan touche. Confirmation avant suppression. |
| 6 | Navigation | 9.5 | Sticky bottom bar mobile ("Retour" + "Valider et continuer"). ProStepper en haut. Le flow auto-ouvre le plan editor au succes. Back button fonctionne. |
| 7 | Mobile | 8.0 | min-h 44px partout, long-press rename, zoom +/- en bas a droite, fusion mode mobile. Mais : pinch-to-zoom ABSENT (boutons +/- seulement), toolbar wrap peut devenir 3 lignes sur 375px (P1-2). |
| 8 | Densite d'information | 9.0 | Plan en hero pleine largeur (preference fondateur). Liste des pieces en dessous, compacte. Les outils avances sont caches par defaut (bon choix). Aide collapsible (bon). |
| 9 | Coherence visuelle | 9.5 | Palette sage #7D9B76 partout (CTA, badges, legende, pills). Background #FAFAF8. Bordures #D1D0CB. Inter implicite via Tailwind. Coherent avec le reste de Versimo. |
| 10 | Confiance pro | 9.0 | La distinction existant/projet (solide vs pointille) est pro. Les badges confiance IA montrent la transparence. Warning surfaces = honnetete. Manque : surface totale du bien + export PDF du plan (P1-3). |

**Note : 9.0 / 10** (+0.2 vs audit final precedent)

---

## Corrections pour 9.5/10

### P1-1 -- Calibration trop cachee (impact critere 2 : +0.5)

La calibration est derriere un bouton "Options" qui ne dit pas ce qu'il contient. Thomas ne sait pas que cette feature existe.

Fichier : `components/marchand/PlanEditor.tsx`, ligne 964 (advanced tools row).
Deplacer le bouton "Calibrer" dans la toolbar PRINCIPALE (a cote de "Nouvelle piece"), retirer du panneau "Options". Garder uniquement le toggle plan/projet dans Options.

```diff
- {/* P1 — Advanced options toggle (UX C3) */}
+ {/* Calibration — toujours visible (Thomas doit la voir) */}
+ <button type="button" onClick={() => { ... }} ...>Calibrer</button>
+ {/* Options avancees — toggle plan/projet uniquement */}
```

### P1-2 -- Toolbar overflow mobile 375px (impact critere 7 : +0.5)

Sur iPhone 15 Pro (393px utile), la toolbar contient : Annuler + Refaire + separateur + Fusionner + Nouvelle piece + separateur + Options = 7 elements. Sur 375px en orientation portrait, ca wrap sur 3 lignes et perd en lisibilite.

Fichier : `components/marchand/PlanEditor.tsx`, ligne 780.
Ajouter `overflow-x-auto` + `scrollbar-hide` sur le container flex, ou grouper Annuler/Refaire dans un sous-menu sur mobile.

```diff
- <div className="flex items-center gap-1.5 flex-wrap">
+ <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide sm:flex-wrap">
```

### P1-3 -- Surface totale absente (impact critere 10 : +0.5)

Thomas gere des operations. Il a besoin de voir "Surface totale : 85.3 m2" quelque part. Aujourd'hui les surfaces sont piece par piece mais jamais totalisees.

Fichier : `app/projet/[id]/extraction/page.tsx`, ligne 639 (bandeau succes).
Ajouter la somme des surfaces a cote du comptage de pieces.

```diff
- {rooms.length} piece{rooms.length > 1 ? "s" : ""} detectee{rooms.length > 1 ? "s" : ""}
+ {rooms.length} piece{rooms.length > 1 ? "s" : ""} detectee{rooms.length > 1 ? "s" : ""}
+  — {rooms.reduce((sum, r) => sum + (r.surface_m2 ?? 0), 0).toFixed(1)} m² au total
```

### P2 -- Legende incomplete (6/17 types affiches)

Fichier : `components/marchand/PlanEditor.tsx`, lignes 1614-1681.
La legende ne montre que Salon, Chambre, Cuisine, SdB/WC, Bureau, Projet. Le Garage, Terrasse, Entree etc. sont absents. Ajouter un "..." avec tooltip ou une legende scrollable.

---

## Verdict

**9.0/10 -- SOUS LE SEUIL 9.5.** Iteration corrective requise.

Les 3 P1 (calibration visible, toolbar mobile, surface totale) representent chacun +0.5 point. Leur implementation porterait la note a 9.5/10. Le P2 (legende) est cosmetique.

Par rapport a la session 42 (8.2) et l'audit final (8.8), la progression est reelle : auto-ouverture du plan, affordance pills, aide collapsible, zoom, fusion mobile. Le gap restant est concentre sur la decouverte de la calibration et l'experience mobile sur petit ecran.
