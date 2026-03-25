# Audit Copy — VisiRénov
> Produit par @copywriter — 2026-03-25
> Référence : brand-voice.md (2026-03-24), value-proposition.md, app/page.tsx, components/StylePicker.tsx

---

## Tableau de synthèse

| # | Critère | Statut | Priorité |
|---|---|---|---|
| 1 | Hero — titre et sous-titre vs value proposition | A CORRIGER | HAUTE |
| 2 | CTA — conformité brand-voice.md | A CORRIGER | HAUTE |
| 3 | Pricing — cohérence avec modèle économique | CRITIQUE | BLOQUANT |
| 4 | Messages d'erreur — actionnables et dans le ton | OK | — |
| 5 | Noms des styles — français, clairs, évocateurs | A CORRIGER | BASSE |
| 6 | Footer — mentions et messaging | OK | — |
| 7 | Mots interdits — lexique "à éviter" brand-voice.md | A CORRIGER | HAUTE |
| 8 | Cohérence tonale — uniformément premium et sobre | A CORRIGER | MOYENNE |

---

## Détail par critère

### 1. Hero — titre et sous-titre (HAUTE)

**Texte actuel (ligne 641-646) :**
> "Visualisez vos espaces / meublés par l'IA"
> Sous-titre : "Uploadez une photo de pièce vide, choisissez un style parmi 11 ambiances, et recevez un visuel meublé en quelques minutes. Pour les pros comme pour les particuliers."

**Problèmes identifiés :**
- Le titre "Visualisez vos espaces meublés par l'IA" est un titre fonctionnel générique — il décrit le mécanisme, pas le bénéfice. Il existe dans la même formulation chez les 3 concurrents (Gepetto, Renovate Club, Pedra).
- "par l'IA" sans contexte contredit la règle brand-voice.md section 3 : "IA seule sans contexte — Crée de la méfiance chez les professionnels".
- "en quelques minutes" est interdit (brand-voice.md lexique négatif) — l'ancrage est "90 secondes".
- "11 ambiances" : le site affiche 11 dans le hero/social proof mais les plans tarifs indiquent aussi 11. StylePicker.tsx compte 11 styles nommés (Haussmannien absent). À aligner sur "12 styles" si le 12e style est intégré, sinon le chiffre doit être cohérent partout.
- "Pour les pros comme pour les particuliers" — registre générique, contraire au positionnement multi-cible explicite des pills.

**Texte recommandé :**
```
Titre : Votre pièce meublée, en 90 secondes.
Sous-titre : Uploadez une photo, choisissez un style parmi 11 ambiances curatées.
VisiRénov préserve votre espace — il ne le réinvente pas.
```
Note : ces formulations sont celles validées dans brand-voice.md section 2A. Le titre est l'ancrage "90 secondes" + "votre pièce". Le sous-titre introduit la différenciation "préserve" sans IA seule.

---

### 2. CTA — conformité brand-voice.md (HAUTE)

**Texte actuel :**
- Header nav : "Essayer" (ligne 619)
- Hero CTA principal : "Essayer gratuitement" (ligne 718) — OK
- Section tool : "Générer la visualisation" (ligne 900) — OK
- Post-résultat : "Relancer avec un autre style" (ligne 1195) — OK
- Upsell crédits épuisés : "Voir les offres" (ligne 1163) — A CORRIGER
- Pricing Découverte : "Commencer" (ligne 1252) — A CORRIGER
- Pricing Business : "Nous contacter" (ligne 1308) — OK

**Problèmes identifiés :**
- "Essayer" dans le header (sans "gratuitement") est ambigu pour les pros — Claire et Thomas lisent "Essayer" comme "Tester en version limitée" mais sans l'ancrage gratuit ils hésitent.
- "Commencer" sur le plan Découverte est générique. Brand-voice.md CTAs validés (section 4D) : "Essayer gratuitement — sans CB" pour Léa.
- "Voir les offres" est passif — verbe d'action absent.

**Texte recommandé :**

| Contexte | Actuel | Recommandé |
|---|---|---|
| Header nav | "Essayer" | "Essayer gratuitement" |
| Pricing Découverte | "Commencer" | "Essayer gratuitement" |
| Upsell crédits épuisés | "Voir les offres" | "Recharger mes crédits" |

---

### 3. Pricing — cohérence avec modèle économique (CRITIQUE — BLOQUANT)

**Texte actuel (lignes 1220-1312) :**
> Trois tiers : Découverte (Gratuit), Pro (29€/mois), Business (79€/mois)

**Problème critique :**
Le project-context.md (ligne 69-71) indique explicitement : **"Modèle économique : Vente de packages (crédits de génération) — PAS d'abonnement mensuel pour le lancement. Pricing actuel sur le site (tiers SaaS mensuel) à REMPLACER par un système de packages unitaires."**

Le copy en production présente un pricing mensuel récurrent qui contredit la décision stratégique documentée. Deux risques :
1. Des utilisateurs souscrivent à un abonnement mensuel qui n'est pas encore implémenté (le bouton Pro dit "Bientôt disponible" — incohérence avec l'affichage d'un prix).
2. Le messaging "Pour les professionnels" sur le Pro à 29€/mois ne correspond à aucun package décidé.

**Action requise :** @product-manager doit valider la grille de packages avant toute correction copy. En attendant, la section pricing ne doit PAS afficher de prix mensuels sans implémentation. Option transitoire recommandée :

```
Titre section : "Tarification à la génération"
Sous-titre : "Payez uniquement ce que vous utilisez — sans abonnement."
[Bouton unique] : "Voir les formules disponibles" → mailto ou waitlist
```

---

### 4. Messages d'erreur (OK)

Les messages d'erreur produits dans page.tsx sont actionnables et dans le ton :
- Ligne 279 : "ne semble pas être une photo d'intérieur. Uploadez une photo de pièce pour un meilleur résultat." — structuré, actionnable.
- Ligne 296 : "Erreur lors du traitement des images. Vérifiez vos fichiers." — factuel, sobre.
- Ligne 101-103 : "La génération a pris trop de temps. Vérifiez votre connexion et réessayez." / "Connexion perdue pendant la génération." — conforme au DO du brand-voice.md section 1.

Seul point mineur : ligne 1089, "Votre iteration n'a pas ete consommee." — accent manquant sur "itération" et "été". Correction typographique uniquement, pas de problème de ton.

---

### 5. Noms des styles (BASSE)

**Styles actuels (StylePicker.tsx) :**
Scandinave, Contemporain, Industriel, Japandi, Art Déco, Mid-Century, Bohème, Méditerranéen, Cosy Moderne, Wabi-Sabi, Maximaliste.

**Problèmes :**
- "Mid-Century" : anglicisme non traduit. Contraire à la règle brand-voice.md "Virtual staging" interdit — même principe pour les anglicismes stylistiques sur le marché FR.
- "Wabi-Sabi" : accepté comme terme du secteur (aucun équivalent FR établi dans la presse déco) — à conserver.
- "Japandi" : idem, terme sectoriel établi — à conserver.

**Recommandation :**
"Mid-Century" → "Rétro Américain" ou "Mid-Century Modern" (avec sous-titre FR "Années 50-60, Amérique") — l'alternative FR pure perd la charge évocatrice du terme. Décision à soumettre à l'utilisateur avant modification.

---

### 6. Footer (OK)

Ligne 1326 : "Pour les architectes, marchands de biens et particuliers" — exact, sobre, conforme.
Ligne 1337 : "© VisiRénov 2026" — correct.
Liens : Tarifs + Contact — minimal, cohérent avec le positionnement premium (pas de surcharge).

---

### 7. Mots interdits du lexique brand-voice.md (HAUTE)

| Mot interdit | Trouvé dans page.tsx | Ligne | Correction |
|---|---|---|---|
| "en quelques minutes" | Sous-titre hero | 646 | → "en 90 secondes" |
| "en quelques minutes" | Timer loader | 960 | → "jusqu'à 2 minutes par image" (déjà présent à la même ligne — conserver la version précise) |
| "Pour les pros comme pour les particuliers" | Sous-titre hero | 646 | → supprimer, intégré dans pills |

Note : "magique", "révolutionnaire", "accessible à tous", "photo-réaliste à 100%" sont absents — bon signal.

---

### 8. Cohérence tonale (MOYENNE)

**Incohérences identifiées :**

- Ligne 728-732 : Les pills USE_CASES affichent "Partagez des pistes d'inspiration" (Architectes) et "Précommercialisez vos opérations" (Marchands) et "Décorez votre futur chez-vous" (Particuliers). Le premier est juste (vocabulaire Claire). Le second est juste (vocabulaire Thomas). Le troisième — "Décorez votre futur chez-vous" — est en dessous du registre de Léa qui ne cherche pas à "décorer" mais à "visualiser avant d'acheter". Registre légèrement générique.

**Texte recommandé pour la pill Particuliers :**
> "Visualisez votre espace avant d'acheter"

- Ligne 1033 : "Ajustement en cours… jusqu'à 2 minutes" — "Ajustement" est le bon terme (neutre, sobre). Cohérent.

- Ligne 1157 : "Pour continuer à affiner, rechargez un pack de crédits." — "pack de crédits" est conforme au modèle économique packages. Conserver.

- Section pricing, Pro : "Pour les professionnels" est trop générique face à "Pour les architectes, marchands de biens" du footer. Si le Pro cible Claire et Thomas, nommer : "Pour les architectes d'intérieur et marchands de biens".

---

## Récapitulatif des corrections prioritaires

| Priorité | Fichier | Correction |
|---|---|---|
| BLOQUANT | page.tsx l.1220-1312 | Remplacer la section pricing mensuelle — aligner sur la décision packages (@product-manager requis avant) |
| HAUTE | page.tsx l.641-646 | Titre hero : "Votre pièce meublée, en 90 secondes." + sous-titre brand-voice.md |
| HAUTE | page.tsx l.646 | Supprimer "en quelques minutes" → "en 90 secondes" |
| HAUTE | page.tsx l.619 | Header CTA "Essayer" → "Essayer gratuitement" |
| HAUTE | page.tsx l.1252 | Pricing CTA "Commencer" → "Essayer gratuitement" |
| HAUTE | page.tsx l.1163 | Upsell CTA "Voir les offres" → "Recharger mes crédits" |
| MOYENNE | page.tsx l.732 | Pill Particuliers → "Visualisez votre espace avant d'acheter" |
| BASSE | page.tsx l.1089 | Typo : "iteration" → "itération", "ete" → "été" |
| BASSE | StylePicker.tsx l.67 | "Mid-Century" → décision à valider avec l'utilisateur |

---

**Handoff → @fullstack**

- Fichiers produits : `docs/copy/copy-audit.md`
- Décisions prises : titre hero validé ("Votre pièce meublée, en 90 secondes."), "en quelques minutes" → "en 90 secondes" non-négociable, CTA header allongé en "Essayer gratuitement"
- Points d'attention : la correction BLOQUANT (pricing) est conditionnée à une décision @product-manager — ne pas implémenter les corrections pricing avant validation de la grille de packages. Toutes les autres corrections sont indépendantes et peuvent être intégrées immédiatement. Les formulations sont tirées directement de brand-voice.md section 2A et 4D — ne pas reformuler.
