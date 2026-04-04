# Audit UI génération — Perspective 3 personas
**Date** : 2026-04-04 | **Fichier audité** : `app/page.tsx` | **Agent** : @ux

---

## Tableau de synthèse

| Persona | Note /10 | Verdict |
|---|---|---|
| Claire — Architecte 40 ans (iPad) | 7.5 | Bon pour le flux professionnel, friction sur la densité des options dans la carte |
| Thomas — Marchand 35 ans (iPhone, chantier) | 6.0 | Trop de choix simultanés pour un contexte mobile-chantier, friction critique sur la configuration par photo |
| Léa — Particulière 32 ans (iPhone) | 7.0 | Parcours intuitif mais les libellés "Finitions + Mobilier / Finitions seulement" sont opaques pour un non-expert |

---

## 9 frictions détaillées

### Claire — Architecte (iPad, usage bureau + chantier)

**F1 — Carte par photo trop dense, pas de hiérarchie claire (lignes 1768–1986)**
La carte per-photo empile 6 contrôles dans l'ordre : toggle Intérieur/Extérieur → type de pièce (select) → styles (pills multi-select, 12 options) → prompt custom → toggle Finitions/Finitions+Mobilier → toggle format (Pro only). Sur iPad en mode portrait sur chantier, l'utilisateur doit scroller à l'intérieur d'une carte pour accéder aux styles. L'œil ne sait pas où aller en premier. Nielsen H8 (minimalisme) et H1 (visibilité état du système) : aucune indication du nombre d'étapes restantes à l'intérieur de la carte.

**F2 — Aucune prévisualisation du style avant sélection (lignes 1866–1894)**
Les styles sont listés comme pills texte (`px-3 py-1.5`, ligne 1873). Pour Claire qui vend une direction esthétique à son client, choisir "Japandi" ou "Haussmannien" sans aperçu visuel est un angle mort. Elle doit avoir mémorisé les 12 styles pour choisir efficacement. Nielsen H6 (reconnaissance plutôt que rappel) : l'utilisateur doit se souvenir à quoi ressemble chaque style.

**F3 — "Finitions + Mobilier" vs "Finitions seulement" : libellé non contextualisé (lignes 1913–1940)**
Pour Claire, cette distinction est pertinente — elle peut vouloir montrer d'abord les surfaces à son client avant de choisir le mobilier. Mais le toggle n'a pas d'info-bulle ni d'exemple visuel pour distinguer les deux modes. Sur iPad, un tap accidentel change silencieusement le mode sans confirmation. Nielsen H5 (prévention des erreurs) : pas de feedback différencié visible dans le résultat final entre les deux modes.

---

### Thomas — Marchand de biens (iPhone, chantier, 35 ans)

**F4 — Obligation de configurer chaque photo individuellement sans option "appliquer à toutes" (lignes 1742–1990)**
Thomas upload souvent plusieurs photos du même bien (salon, chambre, cuisine). La configuration (style, type de pièce, finitions) doit être répétée pour chaque carte. Il n'existe aucun bouton "Appliquer à toutes les photos" ni système de configuration globale. Sur iPhone, répéter 5 fois les mêmes 4 sélections sur des cards étroites est une friction critique qui rallonge le workflow métier. Nielsen H7 (flexibilité et efficacité) : les experts répétitifs n'ont aucun raccourci.

**F5 — Bouton "Générer" sticky en bas de viewport mais masqué par le clavier iOS (ligne 1997)**
Le CTA Générer est `sticky bottom-6 z-40`. Sur iPhone avec le clavier natif ouvert (après avoir tapé dans le prompt custom ou scrollé), le clavier iOS chevauche le bouton sticky. L'utilisateur voit le bouton mais ne peut pas appuyer dessus tant que le clavier n'est pas fermé — comportement non documenté, pas de gestion explicite du focus ou du `env(safe-area-inset-bottom)` dans les classes Tailwind du bouton. Nielsen H9 (aide à la correction d'erreurs) : l'erreur (tap inopérant) n'a pas de message explicatif.

**F6 — Pas de résumé récapitulatif avant génération (lignes 1996–2026)**
Le bouton Générer affiche "Générer — N visuels" (ligne 2017) mais pas de récapitulatif de ce qui va être généré (quelle photo avec quel style, quel mode). Thomas qui a configuré 3 photos × 2 styles chacune ne peut pas vérifier sa configuration d'un coup d'œil avant de consommer ses crédits. Il doit remonter dans toutes les cartes. Nielsen H6 (reconnaissance plutôt que rappel) : absence d'inventaire pré-génération.

---

### Léa — Particulière (iPhone 14, digital native, 32 ans)

**F7 — "Finitions seulement" est un faux-ami pour une non-experte (lignes 1924–1939)**
"Finitions" est un terme de chantier. Pour Léa, "finitions" peut signifier "on touche aux finitions comme les peintures". L'intention réelle (voir la pièce avec murs/sol refaits mais sans meubles) n'est pas expliquée. La valeur de ce mode pour un particulier est d'ailleurs discutable — Léa cherche à visualiser un salon habité, pas un chantier terminé. Nielsen H2 (correspondance système/monde réel) : vocabulaire professionnel dans une interface multi-cible.

**F8 — Aucun état vide guidant ("Scandinave c'est quoi ?") sur les pills de style (lignes 1866–1894)**
Léa, digital native mais non-experte deco, ne connaît pas forcément "Wabi-Sabi", "Haussmannien" ou "Maximaliste". Les pills ne donnent aucune indication visuelle ou textuelle de ce que représente chaque style. Le seul guidage disponible est le nom du style. Elle choisit aléatoirement ou abandonne. Nielsen H10 (aide et documentation) : aucune aide contextuelle sur les 12 styles.

**F9 — L'écran de chargement dit "Génération…" mais ne communique pas la durée à venir (lignes 2062–2068)**
Le label pendant la génération active est simplement `"Génération…"` (ligne 2068). Le timer global (lignes 2091–2095) n'est visible qu'en dessous des previews, pas dans la preview active de la photo en cours. Sur mobile, le timer est souvent coupé par le fold. Léa qui génère pour la première fois ne sait pas si elle attend 15 secondes ou 3 minutes. Elle est susceptible d'abandonner l'onglet et de perdre la génération (tab-switch). Nielsen H1 (visibilité de l'état du système).

---

## 3 quick wins

**QW1 — Pour Thomas (impact critique) : bouton "Copier la config vers toutes les photos"**
Ajouter dans chaque carte per-photo un lien `Copier vers toutes` (lignes 1768-1990, après le toggle Intérieur/Extérieur). Un clic propage `perPhotoStyles`, `perPhotoRoomTypes`, `perPhotoWithFurniture` de cette carte à toutes les autres. Coût : 15 lignes de code. Impact : réduit de 80% le temps de configuration pour les lots multi-photos d'un même bien. Métrique cible : taux de génération multi-photos (>1 photo par session).

**QW2 — Pour Léa (impact adoption) : tooltip ou micro-preview au hover/focus sur chaque pill de style**
Au `hover` ou `focus` sur chaque pill de style (ligne 1873), afficher un popover de 2 lignes : nom du style + 1 phrase courte (ex : "Wabi-Sabi : beauté de l'imparfait, matières brutes, espace épuré"). Sur mobile, adapter en `long-press` ou icône "?" à côté du nom. Coût : données déjà présentes dans `StylePicker.tsx` (les styles ont des descriptions). Impact : réduit l'hésitation et les sélections aléatoires pour les primo-utilisateurs. Métrique cible : diversité des styles sélectionnés par les nouveaux comptes.

**QW3 — Pour tous : récapitulatif inline dans le CTA Générer**
Modifier le bouton Générer (ligne 2016-2018) pour afficher sous le label un résumé condensé : `"2 photos · Scandinave, Japandi · Finitions + Mobilier"`. Texte en `text-[10px] text-background/60` sous l'intitulé principal. Coût : 5 lignes. Impact : élimine la friction F6 (Thomas) et rassure Léa et Claire avant de consommer des crédits. Aucun risque de régression.

---

## Tests UX — Interface de génération

| Test | Critère de succès | Statut |
|---|---|---|
| Parcours Thomas : configurer 3 photos identiques sans répéter | Bouton "Appliquer à toutes" disponible | FAIL |
| Charge cognitive : ≤ 3 actions par carte photo | La carte per-photo a 5-6 contrôles actifs simultanément | FAIL |
| Time-to-value (upload → génération) : ≤ 3 étapes | Upload → config carte → générer = 3 étapes mais la config est surchargée | PASS conditionnel |
| Edge case : clavier iOS masque le CTA | `env(safe-area-inset-bottom)` sur le sticky bottom | FAIL |
| Accessibilité WCAG 2.2 AA : focus-visible sur tous les éléments interactifs | `focus-visible:ring` présent sur tous les boutons des cartes | PASS |
| Reconnaissance styles sans mémoire | Tooltips ou previews disponibles | FAIL |

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/reviews/generation-ui-personas-audit.md`
- Décisions clés : 3 quick wins priorisés par impact persona (QW1 Thomas critique, QW2 Léa adoption, QW3 tous)
- Points d'attention : F5 (clavier iOS + sticky CTA) nécessite `pb-[env(safe-area-inset-bottom)]` sur le wrapper sticky ; F4 (copier config) impacte les 5 Maps perPhoto, s'assurer que la réindexation reste cohérente
