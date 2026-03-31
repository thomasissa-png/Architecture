# Audit UX — ExportPortail (V2a) — Persona Thomas Berger

**Date** : 2026-03-27
**Composant** : `components/ExportPortail.tsx`
**Contexte** : Page `/annonce/[uuid]` — Thomas vient de créer son annonce, il veut exporter vers LeBonCoin.

---

## Score UX Thomas : 6.5 / 10

---

## Parcours simulé — Thomas voulant copier son texte sur LeBonCoin

### Etape 1 — Trouver le composant sur la page
**Friction P0 — visibilité.**
Le composant se charge APRES : header + photo hero (max-h-60vh) + titre + pills + CTA téléphone + RoomNav + galerie photo + atouts + description + caractéristiques + carte OSM + contact + AnnoncePublicView. Soit 10-12 blocs avant ExportPortail.
Thomas scroll plusieurs dizaines de secondes avant de voir "Exporter pour un portail immo". Sur mobile (iPhone 15 Pro), il ne voit jamais le composant sans faire défiler toute la page.

**Ce que Thomas pense** : "C'est où l'export ?" — il cherche dans le header, dans la galerie, pas dans le bas de page.

### Etape 2 — Sélectionner LeBonCoin dans le dropdown
**Flow : OK (1 clic).** Le dropdown s'ouvre, LeBonCoin est listable, la fermeture est propre. Pas de friction ici.
**Point positif** : le label "Choisir un portail" est clair pour le niveau tech de Thomas.

### Etape 3 — Lire les compteurs de caractères
**Friction P1 — anxiogène sans contexte.**
Thomas voit "142/70" en orange ou "480/2000" en gris. Il ne sait pas si c'est bon ou mauvais. Le compteur en rouge (>95%) lui fait croire qu'il y a un problème alors que LeBonCoin tolère les titres longs. La badge "Titre adapté" est trop discrète (10px, orange pastel) pour être remarquée. Il risque de corriger manuellement un texte qui n'en a pas besoin.

### Etape 4 — Copier le texte
**Friction P2 — 2 boutons au lieu de 1, ordre contre-intuitif.**
Thomas voit dans l'ordre : "Copier le titre" (petit, texte vert, discret) puis "Copier la description" (idem) puis "Copier le texte LeBonCoin" (bouton dark pill, plus visible). Il doit mentalement décider entre 3 options. Sur LeBonCoin, le formulaire d'annonce a 2 champs séparés (titre + description), donc copier-coller en 2 fois est logique — mais Thomas ne le sait pas et cliquerait "Copier le texte LeBonCoin" en premier, puis se retrouverait à coller du texte concaténé dans le mauvais champ.

### Etape 5 — Le ZIP photos
**Friction P1 — confusion sur le besoin réel.**
Thomas uploadera ses photos directement sur LeBonCoin depuis son téléphone (c'est son workflow habituel). Le ZIP lui pose la question : "Pourquoi télécharger un ZIP si je télécharge depuis mon iPhone ?" Il ne comprend pas que les photos sont stockées sur Versimo et non sur son appareil. Sans explication, le bouton ZIP est ambigu.

---

## Corrections prioritaires

| Priorité | Friction | Correction |
|---|---|---|
| P0 | Composant invisible sans scroll | Déplacer ExportPortail AVANT la galerie ou ajouter un lien ancre dans le header owner ("Exporter vers les portails") |
| P0 | Champs copie découplés mais mal ordonnés | Mettre "Copier le titre" et "Copier la description" comme actions primaires (boutons dark), supprimer "Copier le texte LeBonCoin" ou le renommer "Copier tout (titre + description)" en secondaire |
| P1 | Compteurs anxiogènes sans explication | Remplacer les compteurs bruts par un indicateur simple : pastille verte "OK pour LeBonCoin" / orange "Adapté" + tooltip au survol avec la règle du portail |
| P1 | ZIP sans contexte | Ajouter une ligne d'explication sous le bouton : "Vos photos HD sont stockées sur Versimo — téléchargez-les pour les importer sur le portail" |
| P2 | Warning "Description incomplète" non actionnable | Remplacer par un lien direct : "Compléter la description →" qui renvoie vers `/mes-biens/[id]` |

---

## Tests UX — ExportPortail

| Test | Critère de succès | Statut |
|---|---|---|
| Thomas trouve le composant en < 5 secondes | Visible dans le premier tiers de la page | ❌ Bas de page, après 12 blocs |
| Flow 3 clics max (sélectionner + copier titre + copier desc) | Pas de décision intermédiaire | ⚠️ 2 clics de copie OK, mais choix entre 3 boutons |
| Compteurs : Thomas sait si son texte est valide | Message binaire OK/problème visible | ❌ Compteurs chiffrés bruts sans interprétation |
| ZIP : Thomas comprend pourquoi sans aide | Label et sous-titre explicites | ❌ Pas de contexte sur l'origine des photos |
| Warning "Description incomplète" est actionnable | Lien vers l'édition | ❌ Texte passif, pas de CTA |

---

## Agents spécialisés recommandés

| Agent proposé | Type | Rôle | Justification | Priorité |
|---|---|---|---|---|
| @marchand-de-biens | Testeur persona | Valider le flow complet export → portail du point de vue Thomas | Thomas est le persona principal de cette feature — un agent dédié doit valider le wording des portails et la logique des champs structurés SeLoger/Bien'ici | Haute |

---

**Handoff → @orchestrator**
- Fichier produit : `/home/user/Architecture/docs/reviews/ux-audit-exportportail.md`
- Décisions prises : score 6.5/10, 2 P0 identifiées (visibilité composant + hiérarchie boutons copie), 2 P1 (compteurs + ZIP)
- Points d'attention : le P0 visibilité est structurel (ordre des blocs dans `page.tsx`) — correction fullstack requise. Les corrections P1 et P2 sont dans `ExportPortail.tsx` uniquement.
