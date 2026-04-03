# Audit Copy — Parcours achat / modale de recharge — Versimo
> Produit par @copywriter — 2026-04-03
> Framework : audit de cohérence (grille 10 critères)
> Périmètre : AuthButton.tsx (modale + dropdown), app/pricing/page.tsx, app/page.tsx (section pricing), components/ProGate.tsx, components/GalleryGate.tsx, lib/stripe.ts (labels Stripe)
> Conscience produit : Solution-Aware à Product-Aware selon le persona

---

## Note globale : 6,8 / 10

Le parcours achat est fonctionnellement solide. Les prix sont cohérents entre les sources. Plusieurs problèmes de copy bloquent la crédibilité ou créent une friction inutile : 4 occurrences du mot "crédit" visible dans l'UI, 2 alertes `alert()` non conformes au brand voice, un label Stripe approximatif, et des incohérences mineures entre les surfaces.

---

## Tableau de synthèse

| # | Critère | Statut | Nb de problèmes |
|---|---|---|---|
| 1 | Cohérence vocabulaire "visuel" vs "crédit" | PROBLÈME | 4 occurrences |
| 2 | Cohérence prix (vérification croisée 5 sources) | OK | — |
| 3 | Ton brand-voice (sobre, sans !, sans superlatif) | PROBLÈME MINEUR | 2 cas |
| 4 | Accents UTF-8 dans les strings JS | OK | — |
| 5 | CTA clairs et actionnables | PROBLÈME | 1 cas |
| 6 | Pluriels conditionnels | OK | — |
| 7 | Messages d'erreur | PROBLÈME | 2 cas (alert) |
| 8 | Labels Stripe | PROBLÈME MINEUR | 1 cas |
| 9 | Registre personas | PROBLÈME MINEUR | 2 cas |
| 10 | Mots interdits | PROBLÈME | 2 occurrences |

---

## Vérification croisée des prix (critère 2)

Tableau de référence — prix extraits de chaque source :

| Pack / Recharge | AuthButton.tsx | pricing/page.tsx | page.tsx (homepage) | GalleryGate.tsx | lib/stripe.ts |
|---|---|---|---|---|---|
| Starter | — | 9,90 € | 9,90 € | 14,90 € ⚠️ | 990 cts = 9,90 € |
| Pro | — | 29 €/mois | 29 €/mois | — | 2900 cts = 29 € |
| Recharge Starter +10 | 5,90 € | 5,90 € | — | — | 590 cts = 5,90 € |
| Recharge Starter +25 | 12,90 € | 12,90 € | — | — | 1290 cts = 12,90 € |
| Recharge Pro +20 | 9 € | 9 € | — | — | 900 cts = 9 € |
| Recharge Pro +50 | 19 € | 19 € | — | — | 1900 cts = 19 € |

**Anomalie P0 identifiée :** GalleryGate.tsx ligne 117 affiche "Pack Starter — 15 visuels — 14,90 €" alors que le prix est 9,90 € partout ailleurs. Ce prix est une relique de l'ancienne grille tarifaire (décision fondateur 2026-03-27 : remplacement du pack Pro one-shot par l'abonnement Pro mensuel + révision des prix). C'est une incohérence bloquante : un utilisateur qui voit 14,90 € dans la gate galerie puis 9,90 € sur /pricing perd confiance.

---

## Détail par critère

### Critère 1 — Cohérence vocabulaire "visuel" vs "crédit" (P1)

Le brand voice impose "visuel" dans toute l'UI. "Crédit" est un terme de back-office, pas un terme utilisateur. Quatre occurrences visibles violent cette règle.

**Problème 1.1 — P1**
Fichier : `app/page.tsx`, ligne 1723
```
`Générer — ${totalCredits} crédits`
```
Correction :
```
`Générer — ${totalCredits} visuel${totalCredits > 1 ? "s" : ""}`
```

**Problème 1.2 — P1**
Fichier : `app/page.tsx`, ligne 2113
```
Pour continuer à affiner, rechargez vos crédits.
```
Correction :
```
Pour continuer à affiner, rechargez vos visuels.
```

**Problème 1.3 — P2**
Fichier : `app/page.tsx`, ligne 1879
```
Votre crédit a été remboursé automatiquement.
```
Correction :
```
Votre visuel a été remboursé automatiquement.
```

**Problème 1.4 — P2**
Fichier : `app/page.tsx`, ligne 340 (toast conditionnel)
```
msg += " Votre crédit a été remboursé."
```
Correction :
```
msg += " Votre visuel a été remboursé."
```

---

### Critère 2 — Cohérence prix : voir tableau de synthèse ci-dessus

**Problème 2.1 — P0 (BLOQUANT)**
Fichier : `components/GalleryGate.tsx`, ligne 117
```
ou Pack Starter — 15 visuels — 14,90&nbsp;&#8364;
```
Correction :
```
ou Pack Starter — 15 visuels — 9,90&nbsp;&#8364;
```
Justification : 14,90 € ne correspond à aucun prix en vigueur. C'est l'ancien tarif. Sur tous les autres points de contact (pricing/page.tsx, homepage, lib/stripe.ts), le Starter est à 9,90 €.

---

### Critère 3 — Ton brand-voice (P2)

**Problème 3.1 — P2**
Fichier : `app/page.tsx`, ligne 1849
```
Votre visuel est prêt !
```
Le point d'exclamation est interdit par le brand-voice ("Pas d'exclamations"). Le brand-voice lui-même formule : "Votre visuel est prêt. Comparez, téléchargez ou relancez avec un autre style."

Correction :
```
Votre visuel est prêt.
```
Note : si le message inclut une suite d'actions proposées, la formulation complète du brand-voice est recommandée : "Votre visuel est prêt. Comparez, téléchargez ou relancez avec un autre style."

**Problème 3.2 — P2**
Fichier : `app/pricing/page.tsx`, ligne 205 (bandeau gratuit)
```
Essayez avec <strong>2 photos gratuites</strong> — sans carte bancaire
```
Le mot "photos" est imprecis ici : l'objet de valeur est le visuel meublé, pas la photo source. "2 visuels offerts" est plus précis et cohérent avec la terminologie homogène de la page.

Correction :
```
Essayez avec <strong>2 visuels offerts</strong> — sans carte bancaire
```
Note : cette formulation est déjà utilisée correctement dans `app/pricing/page.tsx` lignes 244-248 (le pack Découverte affiche "2 photos offertes" via `pack.credits` mais le libellé dynamique dans le data objet dit `photos offertes` — voir problème 3.3).

**Problème 3.3 — P2**
Fichier : `app/pricing/page.tsx`, ligne 246 (PACKS data, cas Découverte)
```
? `${pack.credits} photos offertes`
```
Le terme "photos" dans le rendu du pack Découverte est incohérent avec "visuels" utilisé pour les autres packs sur la même page.

Correction :
```
? `${pack.credits} visuel${pack.credits !== 1 ? "s" : ""} offert${pack.credits !== 1 ? "s" : ""}`
```

---

### Critère 4 — Accents UTF-8 (OK)

Tous les accents dans les strings JS visibles sont corrects (é, è, à, ç, â, î). Aucune séquence `\u00E9` ou entité `&eacute;` dans les strings JavaScript. Les entités HTML (`&nbsp;`, `&#8364;`) utilisées dans le JSX rendu directement sont conformes à la règle.

---

### Critère 5 — CTA clairs et actionnables (P1)

**Problème 5.1 — P1**
Fichier : `app/page.tsx`, ligne 2100 (button disabled)
```
title="Itérations épuisées — rechargez un pack"
```
L'attribut `title` d'un bouton disabled est le seul feedback visible pour l'utilisateur mobile (pas de hover). "Rechargez un pack" est du jargon interne. La formulation doit guider vers l'action.

Correction :
```
title="Itérations épuisées — rechargez des visuels pour continuer"
```

**Problème 5.2 — P2**
Fichier : `app/pricing/page.tsx`, ligne 210
```
{"Essayer l'outil"}
```
L'accolade est un artefact de contournement de l'apostrophe — le rendu est correct mais la formulation est générique. Cohérent avec le CTA Découverte de la grille, donc acceptable. Pas de correction bloquante.

**Ce qui fonctionne bien :**
- Modale AuthButton.tsx — les CTA des lignes de recharge sont des labels directs : "+20 visuels / 9 €", "+50 visuels / 19 €". Format actionnable, prix visible immédiatement. Conforme brand-voice.
- Le lien de bas de modale "Changer d'offre" / "Passer au Pro" est précis et contextuel selon le tier.

---

### Critère 6 — Pluriels conditionnels (OK)

AuthButton.tsx, ligne 158 :
```
{credits} visuel{credits !== 1 ? "s" : ""}
```
AuthButton.tsx, ligne 294 :
```
${credits} visuel${credits !== 1 ? "s" : ""} restant${credits !== 1 ? "s" : ""}
```
app/page.tsx, ligne 2093 :
```
{iterationsRemaining} itération{iterationsRemaining > 1 ? "s" : ""} restante{iterationsRemaining > 1 ? "s" : ""}
```
Les trois cas sont correctement gérés.

---

### Critère 7 — Messages d'erreur (P1)

**Problème 7.1 — P1 (non conforme brand-voice + UX régressif)**
Fichier : `components/AuthButton.tsx`, lignes 88 et 92
```javascript
alert(data.error || "Erreur lors de la recharge");
alert("Erreur réseau. Réessayez.");
```
Les `alert()` natifs sont bloquants, non stylés, et incompatibles avec le design minimaliste de Versimo. Ils créent une rupture totale dans l'expérience. Le brand-voice impose des messages d'erreur actionnables et dans le registre de la marque.

Correction proposée : afficher les erreurs dans la modale elle-même (state `rechargeError`), sous les boutons de pack, avec le même traitement que dans pricing/page.tsx (bandeau rouge ambre).

Formulation pour l'erreur générique :
```
Paiement non initié. Réessayez ou contactez le support.
```
Formulation pour l'erreur réseau :
```
Connexion interrompue. Vérifiez votre réseau et réessayez.
```

**Ce qui fonctionne bien :**
- pricing/page.tsx utilise des états `error` inlinés avec un bandeau stylistiquement cohérent. Le pattern existe déjà — il suffit de le reproduire dans la modale.

---

### Critère 8 — Labels Stripe (P2)

Fichier : `app/api/stripe/checkout/route.ts`, ligne 46
```javascript
name: `Versimo — ${pack.name}`,
description: `${pack.credits} visuels${isSubscription ? "/mois" : ""}`,
```

Et `lib/stripe.ts`, lignes 21-28 :
```
{ id: "recharge-starter-10", name: "Recharge Starter +10", ... }
{ id: "recharge-starter-25", name: "Recharge Starter +25", ... }
{ id: "recharge-pro-20", name: "Recharge Pro +20", ... }
{ id: "recharge-pro-50", name: "Recharge Pro +50", ... }
```

Le nom Stripe résultant sera "Versimo — Recharge Starter +10". C'est fonctionnel mais le tiret em dash utilisé dans la modale (affichage UI) n'est pas utilisé ici — c'est un tiret demi-cadratin (`—`) dans le code. Ce n'est pas un problème bloquant, mais pour la cohérence des reçus Stripe :

Correction recommandée (P2) :
```javascript
{ id: "recharge-starter-10", name: "Recharge Starter +10 visuels", ... }
{ id: "recharge-starter-25", name: "Recharge Starter +25 visuels", ... }
{ id: "recharge-pro-20", name: "Recharge Pro +20 visuels", ... }
{ id: "recharge-pro-50", name: "Recharge Pro +50 visuels", ... }
```
Raison : le reçu Stripe envoyé à l'utilisateur est un document professionnel. "Recharge Starter +10 visuels" est plus lisible que "+10" seul sur la facture.

---

### Critère 9 — Registre personas (P2)

**Problème 9.1 — P2**
Fichier : `components/ProGate.tsx`, ligne 94
```
Pack Pro (29&nbsp;&#8364;/mois) inclut :
```
"Pack Pro" est une formulation incohérente avec la décision de renommage fondateur (2026-03-27 : le plan mensuel s'appelle "Pro", pas "Pack Pro"). "Pack" renvoie à un achat one-shot, ce qui contredit le positionnement abonnement.

Correction :
```
Pro — 29&nbsp;&#8364;/mois
```
Ou, avec le sous-titre fonctionnel inclus :
```
Abonnement Pro (29&nbsp;&#8364;/mois) — inclut :
```

**Problème 9.2 — P2**
Fichier : `components/ProGate.tsx`, ligne 127
```
"Découvrir les offres Pro"
```
Ce CTA renvoie vers `/#pricing`. C'est correct. Mais "Découvrir les offres Pro" (pluriel) sous-entend plusieurs offres Pro, alors qu'il n'y en a qu'une. Formulation plus précise pour Thomas ou Claire :

Correction :
```
Passer au Pro — 29 €/mois
```
C'est conforme au CTA brand-voice ("Voir le plan Business" / "Voir le plan Pro") et supprime l'ambiguité du pluriel.

---

### Critère 10 — Mots interdits (P1)

**Problème 10.1 — P1**
Fichier : `app/page.tsx`, lignes 1723 (déjà signalé en critère 1)
Le terme "crédits" dans le label du bouton "Générer" est le mot interdit dans l'UI le plus visible. L'utilisateur le voit à chaque génération.

**Problème 10.2 — P1**
Fichier : `app/page.tsx`, ligne 2113
```
rechargez vos crédits
```
Identique — "crédits" dans un message contextuel visible par tous les utilisateurs ayant épuisé leurs itérations.

Ces deux cas sont déjà traités en critère 1. Ils sont rappelés ici car leur présence sur la page principale (la plus fréquentée) les classe P1 ferme.

---

## Récapitulatif des corrections par priorité

### P0 — Bloquant (1 correction)

| ID | Fichier | Ligne | Problème | Correction |
|---|---|---|---|---|
| C-01 | `components/GalleryGate.tsx` | 117 | Prix Starter affiché : 14,90 € au lieu de 9,90 € | `9,90&nbsp;&#8364;` |

### P1 — Important (5 corrections)

| ID | Fichier | Ligne | Problème | Correction |
|---|---|---|---|---|
| C-02 | `app/page.tsx` | 1723 | "crédits" dans le CTA Générer | `visuel${totalCredits > 1 ? "s" : ""}` |
| C-03 | `app/page.tsx` | 2113 | "rechargez vos crédits" | "rechargez vos visuels" |
| C-04 | `components/AuthButton.tsx` | 88 | `alert()` sur erreur paiement | State inline dans la modale |
| C-05 | `components/AuthButton.tsx` | 92 | `alert()` sur erreur réseau | State inline dans la modale |
| C-06 | `app/page.tsx` | 2100 | title du button disabled : "rechargez un pack" | "rechargez des visuels pour continuer" |

### P2 — Recommandé (6 corrections)

| ID | Fichier | Ligne | Problème | Correction |
|---|---|---|---|---|
| C-07 | `app/page.tsx` | 1849 | Point d'exclamation interdit | "Votre visuel est prêt." |
| C-08 | `app/pricing/page.tsx` | 205 | "2 photos gratuites" incohérent | "2 visuels offerts" |
| C-09 | `app/pricing/page.tsx` | 246 | "photos offertes" dans le data | "visuels offerts" |
| C-10 | `app/page.tsx` | 1879 | "Votre crédit a été remboursé" | "Votre visuel a été remboursé automatiquement" |
| C-11 | `components/ProGate.tsx` | 94 | "Pack Pro" (formulation one-shot) | "Abonnement Pro" ou "Pro — 29 €/mois" |
| C-12 | `components/ProGate.tsx` | 127 | CTA "Découvrir les offres Pro" (pluriel) | "Passer au Pro — 29 €/mois" |
| C-13 | `lib/stripe.ts` | 24-28 | Labels recharges sans "visuels" | "Recharge Starter +10 visuels" etc. |

---

## Ce qui fonctionne bien (à conserver)

- **Pluriels conditionnels** : les 3 cas gérés dans AuthButton.tsx et page.tsx sont corrects.
- **Architecture de la modale** : titre sobre, solde affiché, packs differentiated par tier (Pro vs Starter), lien discret "Changer d'offre / Passer au Pro" en bas. Structure conforme au brand-voice.
- **Prix visibles sur chaque ligne de pack** : format "+20 visuels / 9 €" — direct, sans chichi.
- **Accents UTF-8** : aucun problème dans les strings JS.
- **Cohérence prix** : à l'exception de GalleryGate (C-01), tous les montants sont identiques entre les 4 autres sources.
- **Labels Stripe de base** : `Versimo — Starter` et `Versimo — Pro` sont propres.
- **FAQ /pricing** : les 6 questions traitent les vraies objections (expiration, report, résiliation, changement d'offre, facture, sécurité). Registre sobre et factuel, conforme brand-voice.
- **Message "Itérations épuisées"** dans les tooltips et labels techniques (code) : le terme "crédits" en back-office et commentaires de code est toléré — la règle ne s'applique qu'à l'UI visible.

---

## Note sur la correction C-04 et C-05 (remplacement des `alert()`)

La correction implique un travail frontend. Voici le pattern minimal à implémenter dans AuthButton.tsx :

```tsx
// Ajouter dans le state
const [rechargeError, setRechargeError] = useState<string | null>(null);

// Dans handleRecharge(), remplacer :
// alert(data.error || "Erreur lors de la recharge");
// → setRechargeError(data.error || "Paiement non initié. Réessayez.");
// alert("Erreur réseau. Réessayez.");
// → setRechargeError("Connexion interrompue. Vérifiez votre réseau et réessayez.");

// Dans la modale, après les boutons de pack, ajouter :
{rechargeError && (
  <p className="mt-3 text-xs text-red-600/80 text-center font-light">
    {rechargeError}
  </p>
)}

// Reset à l'ouverture de la modale :
onClick={() => { setMenuOpen(false); setRechargeError(null); setRechargeOpen(true); }}
```

---

---
**Handoff → @fullstack**
- Fichiers produits : `docs/copy/copy-audit-parcours-achat-2026-04-03.md`
- Corrections à implémenter par priorité :
  - **P0** : C-01 — GalleryGate.tsx ligne 117 — prix 14,90 € → 9,90 €
  - **P1** : C-02/C-03/C-06/C-10 — remplacer "crédits" et "crédit" par "visuels" dans page.tsx
  - **P1** : C-04/C-05 — remplacer les deux `alert()` dans AuthButton.tsx par un state `rechargeError` inline (pattern fourni ci-dessus)
  - **P2** : C-07/C-08/C-09/C-11/C-12 — corrections de formulation légères
  - **P2** : C-13 — lib/stripe.ts — enrichir les noms des recharges avec "visuels"
- Formulations non négociables : "visuels" (jamais "crédits" ni "photos" dans l'UI), pas de point d'exclamation, pas d'`alert()` native
- Points d'attention : les corrections P1 sur page.tsx (C-02/C-03) touchent la logique de label dynamique — vérifier le pluriel conditionnel sur le CTA "Générer" après correction
