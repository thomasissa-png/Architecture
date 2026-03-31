# Audit Scroll des Modals et Pop-ups — Versimo

**Date** : 2026-03-31
**Auteur** : @qa
**Contexte** : Bug signale par le fondateur — quand l'utilisateur a 2 visuels et veut affiner le 2e, le RefineModal provoque une remontee en haut de page.

---

## Inventaire des modals

8 modals/dialogs identifies dans le projet :

| # | Composant | Fichier | Type |
|---|---|---|---|
| M1 | RefineModal | `components/RefineModal.tsx` | Composant dedie |
| M2 | AuthModal | `components/AuthModal.tsx` | Composant dedie |
| M3 | ExportPortailModal | `components/ExportPortailModal.tsx` | Composant dedie |
| M4 | Lightbox | `components/Lightbox.tsx` | Composant dedie |
| M5 | Photo Detail Modal | `app/ma-galerie/page.tsx:436` | Inline |
| M6 | Associate Modal | `app/mes-biens/[id]/page.tsx:1065` | Inline |
| M7 | Dossier Creation Modal | `app/mes-biens/[id]/page.tsx:1151` | Inline |
| M8 | Delete Confirmation | `app/mes-biens/[id]/page.tsx:1277` | Inline (alertdialog) |

---

## Grille d'evaluation

Chaque modal est evalue sur 5 criteres :

1. **position: fixed + overlay centre** — le modal couvre tout le viewport sans dependre du scroll
2. **body overflow: hidden** — le scroll du body est bloque pendant que le modal est ouvert
3. **Sauvegarde position scroll** — la position de scroll est sauvegardee avant ouverture
4. **Restauration position scroll** — la position de scroll est restauree apres fermeture (pas de saut)
5. **Pas de scroll involontaire a l'ouverture** — l'ouverture du modal ne cause pas de scrollTo/scrollIntoView

---

## Resultats detailles

### M1 — RefineModal (`components/RefineModal.tsx`) — BUG CONFIRME

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-50` (ligne 116) |
| body overflow hidden | PASS | `document.body.style.overflow = "hidden"` (ligne 82) |
| Sauvegarde scroll | PASS | `savedScrollY.current = window.scrollY` (ligne 81) |
| Restauration scroll | **FAIL** | Voir analyse ci-dessous |
| Pas de scroll involontaire | **FAIL** | Voir analyse ci-dessous |

**Analyse du bug** :

Le useEffect ligne 79-91 a un defaut structurel :

```typescript
useEffect(() => {
  if (isOpen) {
    savedScrollY.current = window.scrollY;
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
    window.scrollTo(0, savedScrollY.current);  // <-- PROBLEME
  }
  return () => {
    document.body.style.overflow = "";
  };
}, [isOpen]);
```

**Probleme 1 — Execution au montage initial** : Quand le composant se monte pour la premiere fois, `isOpen` est `false`. Le useEffect execute la branche `else` et appelle `window.scrollTo(0, 0)` car `savedScrollY.current` est initialise a `0`. Si l'utilisateur est scrolle en bas de page (par exemple au niveau du 2e resultat), le navigateur remonte en haut de page.

Ce n'est PAS le probleme principal signale, car RefineModal se monte une seule fois dans `app/page.tsx:1888` et reste dans le DOM. Le `isOpen` controle l'affichage via `if (!isOpen) return null` (ligne 110).

**Probleme 2 — Race condition avec overflow: hidden et position de page** : Quand `overflow: hidden` est applique au body, certains navigateurs (notamment Safari iOS et Chrome mobile) effectuent un scroll involontaire. Le probleme est que `overflow: hidden` sur `<body>` peut provoquer un saut a `scrollTop = 0` car le body n'est plus scrollable. La position est sauvegardee, mais entre le moment ou `overflow: hidden` est applique et le moment ou le modal est ferme, le scroll peut etre perdu sur mobile.

**Probleme 3 (CAUSE RACINE DU BUG SIGNALE) — Le modal ne gere pas le layout shift du contenu sous-jacent** : Quand `overflow: hidden` est applique au body, le contenu de la page est repositionne (le body perd sa scrollabilite). Sur les navigateurs ou la scrollbar occupe de l'espace (desktop Windows/Linux), le contenu se decale. Mais le probleme principal est que `document.body.style.overflow = "hidden"` SANS `position: fixed` + `top: -scrollY` sur le body fait que certains navigateurs (Safari iOS) "sautent" en haut. La solution standard est :

```typescript
// A l'ouverture :
const scrollY = window.scrollY;
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollY}px`;
document.body.style.width = '100%';

// A la fermeture :
document.body.style.position = '';
document.body.style.top = '';
document.body.style.width = '';
window.scrollTo(0, scrollY);
```

**Correction recommandee** : `components/RefineModal.tsx:78-91` — Remplacer le pattern `overflow: hidden` par le pattern `position: fixed + top: -scrollY` decrit ci-dessus. Ce pattern est le seul qui fonctionne de maniere fiable sur tous les navigateurs, y compris Safari iOS.

---

### M2 — AuthModal (`components/AuthModal.tsx`) — FAIL

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-[100]` (ligne 209) |
| body overflow hidden | PASS | `document.body.style.overflow = "hidden"` (ligne 104) |
| Sauvegarde scroll | **FAIL** | Aucune sauvegarde de `window.scrollY` |
| Restauration scroll | **FAIL** | Pas de restauration — le scroll peut sauter a la fermeture |
| Pas de scroll involontaire | **FAIL** | Meme pattern `overflow: hidden` sans `position: fixed` |

**Analyse** : Lignes 102-109 — le code met `overflow: hidden` et le retire, mais ne sauvegarde ni ne restaure la position de scroll. Sur Safari iOS, la fermeture du modal peut provoquer un saut en haut de page.

**Correction recommandee** : `components/AuthModal.tsx:102-109` — Appliquer le meme pattern `position: fixed + top: -scrollY` que la correction recommandee pour RefineModal.

---

### M3 — ExportPortailModal (`components/ExportPortailModal.tsx`) — FAIL

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-[100]` (ligne 85) |
| body overflow hidden | PASS | `document.body.style.overflow = "hidden"` (ligne 59) |
| Sauvegarde scroll | **FAIL** | Aucune sauvegarde de `window.scrollY` |
| Restauration scroll | **FAIL** | Pas de restauration |
| Pas de scroll involontaire | **FAIL** | Meme pattern sans `position: fixed` |

**Analyse** : Lignes 57-66 — meme pattern defaillant que AuthModal.

**Correction recommandee** : `components/ExportPortailModal.tsx:57-66` — Appliquer le pattern `position: fixed + top: -scrollY`.

---

### M4 — Lightbox (`components/Lightbox.tsx`) — PASS CONDITIONNEL

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-[100]` (ligne 66) |
| body overflow hidden | PASS | Sauvegarde la valeur precedente de overflow (ligne 41-46) |
| Sauvegarde scroll | **FAIL** | Ne sauvegarde pas `window.scrollY` |
| Restauration scroll | **FAIL** | Ne restaure pas la position |
| Pas de scroll involontaire | PASS | Pas de scroll involontaire a l'ouverture |

**Analyse** : Lignes 40-46 — le Lightbox est le seul modal a sauvegarder la valeur PRECEDENTE de `overflow` (`const prev = document.body.style.overflow`), ce qui est bien pour le cas ou un autre modal est deja ouvert. Mais il ne gere pas la position de scroll.

**Impact reel** : Le Lightbox est un viewer plein ecran avec fond noir opaque (`bg-black/95`). Le saut de scroll est moins visible car l'utilisateur ne voit pas le contenu sous-jacent. Le risque est faible mais existe a la fermeture.

**Correction recommandee** : `components/Lightbox.tsx:40-46` — Ajouter la sauvegarde/restauration de scroll, idealement avec le pattern `position: fixed + top`.

---

### M5 — Photo Detail Modal (`app/ma-galerie/page.tsx:436`) — PASS PARTIEL

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-50` (ligne 438) |
| body overflow hidden | PASS | Via useEffect global (ligne 84-114) |
| Sauvegarde scroll | **FAIL** | Aucune sauvegarde de `window.scrollY` |
| Restauration scroll | **FAIL** | Le cleanup restaure overflow mais pas le scroll |
| Pas de scroll involontaire | PASS | Pas de scrollTo appele a l'ouverture |

**Analyse** : Le scroll lock est gere dans un useEffect centralise (lignes 84-114) qui se declenche quand `selectedPhoto` change. Il met `overflow: hidden` mais ne sauvegarde pas la position.

**Correction recommandee** : `app/ma-galerie/page.tsx:84-114` — Ajouter le pattern `position: fixed + top: -scrollY`.

---

### M6 — Associate Modal (`app/mes-biens/[id]/page.tsx:1065`) — PASS PARTIEL

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-50` (ligne 1066) |
| body overflow hidden | PASS | Via useEffect centralise (ligne 134-171) |
| Sauvegarde scroll | **FAIL** | Aucune sauvegarde |
| Restauration scroll | **FAIL** | Pas de restauration |
| Pas de scroll involontaire | PASS | Pas de scrollTo |

**Correction recommandee** : `app/mes-biens/[id]/page.tsx:134-171` — Ajouter le pattern `position: fixed + top: -scrollY` dans le useEffect centralise.

---

### M7 — Dossier Creation Modal (`app/mes-biens/[id]/page.tsx:1151`) — PASS PARTIEL

Partage le meme useEffect que M6. Meme verdict, meme correction.

---

### M8 — Delete Confirmation (`app/mes-biens/[id]/page.tsx:1277`) — FAIL

| Critere | Verdict | Detail |
|---|---|---|
| fixed + overlay | PASS | `fixed inset-0 z-50` (ligne 1278) |
| body overflow hidden | **FAIL** | Aucun scroll lock — le body reste scrollable derriere le modal |
| Sauvegarde scroll | **FAIL** | Aucune |
| Restauration scroll | N/A | Pas de scroll lock, donc pas de restauration |
| Pas de scroll involontaire | PASS | Pas de scrollTo |

**Analyse** : Le modal de confirmation de suppression n'est PAS couvert par le useEffect centralise (qui ne couvre que `showAssociateModal` et `showDossierModal`). Le body reste scrollable en arriere-plan.

**Correction recommandee** : `app/mes-biens/[id]/page.tsx:134` — Ajouter `showDeleteConfirm` a la condition du useEffect centralise : `const isOpen = showAssociateModal || showDossierModal || showDeleteConfirm;`

---

## Tableau recapitulatif

| # | Modal | fixed | overflow | Save scroll | Restore scroll | No involuntary scroll | Verdict |
|---|---|---|---|---|---|---|---|
| M1 | RefineModal | PASS | PASS | PASS | FAIL | FAIL | **BUG** |
| M2 | AuthModal | PASS | PASS | FAIL | FAIL | FAIL | **FAIL** |
| M3 | ExportPortailModal | PASS | PASS | FAIL | FAIL | FAIL | **FAIL** |
| M4 | Lightbox | PASS | PASS | FAIL | FAIL | PASS | FAIL |
| M5 | Photo Detail | PASS | PASS | FAIL | FAIL | PASS | FAIL |
| M6 | Associate Modal | PASS | PASS | FAIL | FAIL | PASS | FAIL |
| M7 | Dossier Modal | PASS | PASS | FAIL | FAIL | PASS | FAIL |
| M8 | Delete Confirm | PASS | FAIL | FAIL | N/A | PASS | **FAIL** |

**Resultat** : 0/8 modals PASS complet. 8/8 ont au moins un defaut de gestion du scroll.

---

## Correction unifiee recommandee

Creer un hook reutilisable `useScrollLock()` dans `lib/hooks/useScrollLock.ts` :

```typescript
import { useEffect, useRef } from "react";

/**
 * Bloque le scroll du body quand isLocked = true.
 * Preserve et restaure la position de scroll de maniere fiable
 * sur tous les navigateurs (y compris Safari iOS).
 */
export function useScrollLock(isLocked: boolean) {
  const scrollY = useRef(0);

  useEffect(() => {
    if (isLocked) {
      scrollY.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      // width 100% evite le content shift quand la scrollbar disparait
      document.body.style.width = "100%";
    } else {
      const savedY = scrollY.current;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, savedY);
    }

    return () => {
      // Cleanup en cas de demontage pendant que le lock est actif
      if (isLocked) {
        const savedY = scrollY.current;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, savedY);
      }
    };
  }, [isLocked]);
}
```

Puis remplacer chaque implementation ad-hoc par :

| Fichier | Lignes a modifier | Remplacement |
|---|---|---|
| `components/RefineModal.tsx` | 78-91 | `useScrollLock(isOpen);` — supprimer le useEffect et le ref `savedScrollY` |
| `components/AuthModal.tsx` | 102-109 | `useScrollLock(isOpen);` — supprimer le useEffect |
| `components/ExportPortailModal.tsx` | 57-66 | `useScrollLock(isOpen);` — supprimer le useEffect |
| `components/Lightbox.tsx` | 40-46 | `useScrollLock(true);` (le composant ne se monte que quand ouvert) |
| `app/ma-galerie/page.tsx` | 84-86 + 112 | `useScrollLock(!!selectedPhoto);` — supprimer les lignes overflow du useEffect |
| `app/mes-biens/[id]/page.tsx` | 134-137 + 169 | `useScrollLock(showAssociateModal \|\| showDossierModal \|\| showDeleteConfirm);` — supprimer les lignes overflow du useEffect |

---

## Priorite des corrections

| Priorite | Modal | Justification |
|---|---|---|
| **P0** | RefineModal (M1) | Bug signale par le fondateur — affecte le parcours principal (generation + affinage) |
| **P1** | AuthModal (M2) | Affecte le parcours de connexion — tous les utilisateurs |
| **P1** | Delete Confirm (M8) | Pas de scroll lock du tout — scroll du body possible derriere le modal |
| **P2** | ExportPortailModal (M3) | Affecte les marchands de biens (persona Thomas) |
| **P2** | Photo Detail (M5) | Galerie utilisateur |
| **P2** | Associate/Dossier (M6/M7) | Pages Pro secondaires |
| **P3** | Lightbox (M4) | Impact faible (fond opaque masque le contenu) |

---

**Handoff -> @fullstack**
- Fichier produit : `docs/qa/modal-scroll-audit.md`
- Decisions prises : pattern `position: fixed + top: -scrollY` recommande (standard industrie, fonctionne sur Safari iOS). Hook reutilisable `useScrollLock()` pour factoriser.
- Points d'attention :
  - Le bug P0 RefineModal est reproductible en uploadant 2 photos, generant les resultats, puis en cliquant "Affiner ce resultat" sur le 2e resultat quand on est scrolle en bas de page
  - Le pattern `overflow: hidden` seul est insuffisant sur Safari iOS — il faut `position: fixed`
  - Le Delete Confirmation modal (M8) n'a AUCUN scroll lock — a ajouter au useEffect centralise
  - Tester sur Safari iOS apres correction (c'est le navigateur le plus problematique pour le scroll lock)
---
